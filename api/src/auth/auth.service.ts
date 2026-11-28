import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { Supabase } from 'src/supabase/supabase';
import {
  AccessTokenDto,
  AuthDto,
  AuthInvitationDataDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  OAuthRedirectDto,
  OtpSignInRequestDto,
  OtpSignInVerifyDto,
  ResetPasswordDto,
  SetPasswordDto,
  SignInDto,
  SignUpDto,
  TokenRefreshDto,
  UserIdentitiesResponseDto,
  UserIdentityDto,
} from 'src/types';
import { User } from 'src/entities';
import { UsersService } from 'src/users/users.service';
import { fetchWithTimeout } from 'src/utils/fetch-with-timeout';

/** OAuth providers supported for sign-in and identity linking. */
const SSO_PROVIDERS = ['google', 'spotify'];

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly supabaseClient: SupabaseClient;

  constructor(
    supabase: Supabase,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
  ) {
    this.supabaseClient = supabase.getClient();
  }

  private get supabaseUrl(): string {
    return this.configService.get('supabase.url')!;
  }

  private get supabaseKey(): string {
    return this.configService.get('supabase.key')!;
  }

  async signIn(signInDto: SignInDto): Promise<AccessTokenDto> {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email: signInDto.email,
      password: signInDto.password,
      options: {
        ...(signInDto.captchaToken && { captchaToken: signInDto.captchaToken }),
      },
    });

    if (error) {
      switch (error.status) {
        case 401:
        case 403:
          throw new ForbiddenException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    const inviteOrgId = await this.acceptInviteForAuthUser(
      data.user?.id,
      signInDto.invite,
    );

    return {
      user: data.user,
      session: data.session,
      inviteOrgId: inviteOrgId,
    } as AccessTokenDto;
  }

  async signInWithProvider(
    provider: string,
    _authDto?: AuthDto,
  ): Promise<OAuthRedirectDto> {
    if (!SSO_PROVIDERS.includes(provider)) {
      throw new BadRequestException(
        `Provider ${provider} not supported for sign in`,
      );
    }

    const redirectTo =
      this.configService.get('app.baseUrl') + '/oauth/callback';
    const codeVerifier = this.generatePKCEVerifier();
    const codeChallenge = this.generatePKCEChallenge(codeVerifier);

    const params = new URLSearchParams({
      provider,
      redirect_to: redirectTo,
      code_challenge: codeChallenge,
      code_challenge_method: 's256',
    });

    const response = await fetchWithTimeout(
      `${this.supabaseUrl}/auth/v1/authorize?${params.toString()}`,
      {
        headers: { apikey: this.supabaseKey },
        redirect: 'manual',
      },
    );

    // The /auth/v1/authorize endpoint returns a 302 redirect to the
    // provider's consent screen. Extract the URL from the Location header.
    const url = response.headers.get('location');

    if (!url) {
      const body = await response.text();
      throw new BadRequestException(
        `Failed to initiate OAuth sign-in: ${body}`,
      );
    }

    return { url, codeVerifier };
  }

  async exchangeCodeForSession(
    code: string,
    codeVerifier: string,
    _locale?: string,
  ): Promise<AccessTokenDto> {
    const response = await fetchWithTimeout(
      `${this.supabaseUrl}/auth/v1/token?grant_type=pkce`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.supabaseKey,
        },
        body: JSON.stringify({ auth_code: code, code_verifier: codeVerifier }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        `Failed to exchange code for session: ${body}`,
      );
    }

    const data = await response.json();

    return {
      user: data.user,
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        ...data,
      },
    } as AccessTokenDto;
  }

  async signUp(signUpDto: SignUpDto): Promise<AccessTokenDto> {
    const { data, error } = await this.supabaseClient.auth.signUp({
      email: signUpDto.email,
      password: signUpDto.password,
      options: {
        emailRedirectTo: this.configService.get('app.baseUrl') + '/app',
        ...(signUpDto.captchaToken && { captchaToken: signUpDto.captchaToken }),
        ...(signUpDto.locale && { data: { locale: signUpDto.locale } }),
      },
    });

    if (error) {
      switch (error.status) {
        case 401:
        case 403:
          throw new ForbiddenException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    const inviteOrgId = await this.acceptInviteForAuthUser(
      data.user?.id,
      signUpDto.invite,
    );

    return {
      user: data.user,
      session: data.session,
      inviteOrgId: inviteOrgId,
    } as AccessTokenDto;
  }

  async tokenRefresh(
    tokenRefreshDto: TokenRefreshDto,
  ): Promise<AccessTokenDto> {
    const { data, error } = await this.supabaseClient.auth.refreshSession({
      refresh_token: tokenRefreshDto.refreshToken,
    });

    if (error) {
      // The app signs the user out on 400/403 from this endpoint, so only an
      // invalid refresh token may map to those. Rate limits and Supabase
      // outages must stay distinguishable so a transient failure does not
      // end the session.
      if (error.status === 429) {
        throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
      }
      if (!error.status || error.status >= 500) {
        throw new ServiceUnavailableException(
          'Authentication service unavailable',
        );
      }
      switch (error.status) {
        case 401:
        case 403:
          throw new ForbiddenException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Accepts the invitation the user signed in or up with. Failures are
   * logged and ignored: they must not fail the sign-in itself.
   * Returns the organization joined, if any.
   */
  private async acceptInviteForAuthUser(
    authUserId: string | undefined,
    inviteData: AuthInvitationDataDto | undefined,
  ): Promise<number | undefined> {
    if (!inviteData || !authUserId) {
      return undefined;
    }

    try {
      const invite = await this.organizationsService.getInvitation(
        inviteData.id,
        inviteData.secret,
      );
      const user = await this.usersService.findByAuthId(authUserId);
      if (!invite || !user) {
        return undefined;
      }

      await this.organizationsService.acceptInvitation(invite.id, user);
      return invite.orgId;
    } catch (e) {
      this.logger.warn(`Error accepting invite: ${e}`);
      return undefined;
    }
  }

  /**
   * Links an invitation to a user who signed in through OAuth. Failures are
   * logged and ignored. Returns the organization joined, if any.
   */
  async associateInvite(
    authUserId: string,
    inviteData: AuthInvitationDataDto,
  ): Promise<number | undefined> {
    try {
      const invitation = await this.organizationsService.associateInvite(
        authUserId,
        inviteData,
      );
      return invitation.orgId;
    } catch (e) {
      this.logger.warn(`Error associating invite: ${e}`);
      return undefined;
    }
  }

  async changePassword(
    user: User,
    accessToken: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    if (!user.email) {
      throw new BadRequestException('Your account has no email address');
    }

    const { error: authError } =
      await this.supabaseClient.auth.signInWithPassword({
        email: user.email,
        password: changePasswordDto.currentPassword,
      });

    if (authError) {
      throw new ForbiddenException(authError.message);
    }

    const response = await fetchWithTimeout(
      `${this.supabaseUrl}/auth/v1/user`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: this.supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: changePasswordDto.newPassword }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      const status = response.status;
      if (status === 401 || status === 403) {
        throw new ForbiddenException(`Failed to update password: ${body}`);
      }
      throw new BadRequestException(`Failed to update password: ${body}`);
    }
  }

  async getIdentities(accessToken: string): Promise<UserIdentitiesResponseDto> {
    const { data, error } = await this.supabaseClient.auth.getUser(accessToken);
    if (error) {
      throw new BadRequestException(error.message);
    }

    const identities: UserIdentityDto[] = (data.user.identities || []).map(
      (identity) => ({
        identityId: identity.identity_id,
        provider: identity.provider,
        email: identity.identity_data?.email,
        createdAt: identity.created_at,
      }),
    );

    const hasPassword = identities.some(
      (identity) => identity.provider === 'email',
    );

    return { identities, hasPassword };
  }

  async linkIdentity(
    provider: string,
    accessToken: string,
  ): Promise<OAuthRedirectDto> {
    if (!SSO_PROVIDERS.includes(provider)) {
      throw new BadRequestException(
        `Provider ${provider} not supported for identity linking`,
      );
    }

    const redirectTo =
      this.configService.get('app.baseUrl') + '/oauth/link-callback';

    const codeVerifier = this.generatePKCEVerifier();
    const codeChallenge = this.generatePKCEChallenge(codeVerifier);

    const params = new URLSearchParams({
      provider,
      redirect_to: redirectTo,
      code_challenge: codeChallenge,
      code_challenge_method: 's256',
      skip_http_redirect: 'true',
    });

    const response = await fetchWithTimeout(
      `${this.supabaseUrl}/auth/v1/user/identities/authorize?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: this.supabaseKey,
        },
        redirect: 'manual',
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        `Failed to initiate identity linking: ${body}`,
      );
    }

    const data = await response.json();

    if (!data.url) {
      throw new BadRequestException(
        'No redirect URL returned from identity linking',
      );
    }

    // The raw verifier: the app sends it back to /auth/validate, where it must
    // hash to the code challenge above.
    return { url: data.url, codeVerifier };
  }

  async unlinkIdentity(identityId: string, accessToken: string): Promise<void> {
    // Verify the user has more than one identity before unlinking
    const { identities } = await this.getIdentities(accessToken);
    if (identities.length <= 1) {
      throw new BadRequestException(
        'Cannot unlink the only identity. You must have at least one sign-in method.',
      );
    }

    const identity = identities.find((i) => i.identityId === identityId);
    if (!identity) {
      throw new BadRequestException('Identity not found');
    }

    // Ensure user has a password if unlinking an OAuth provider
    if (identity.provider !== 'email') {
      const hasPassword = identities.some((i) => i.provider === 'email');
      if (!hasPassword) {
        throw new BadRequestException(
          'You must set a password before disconnecting your OAuth provider.',
        );
      }
    }

    const response = await fetchWithTimeout(
      `${this.supabaseUrl}/auth/v1/user/identities/${identityId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: this.supabaseKey,
        },
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(`Failed to unlink identity: ${body}`);
    }
  }

  async setPassword(
    setPasswordDto: SetPasswordDto,
    accessToken: string,
  ): Promise<void> {
    // Verify user doesn't already have a password
    const { hasPassword } = await this.getIdentities(accessToken);
    if (hasPassword) {
      throw new BadRequestException(
        'User already has a password. Use changePassword instead.',
      );
    }

    const response = await fetchWithTimeout(
      `${this.supabaseUrl}/auth/v1/user`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: this.supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: setPasswordDto.newPassword }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(`Failed to set password: ${body}`);
    }
  }

  /**
   * Triggers the Supabase password-recovery email. Always resolves
   * successfully — even when the email does not exist — to avoid leaking which
   * addresses are registered.
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const redirectTo =
      this.configService.get('app.baseUrl') + '/reset-password';

    const { error } = await this.supabaseClient.auth.resetPasswordForEmail(
      forgotPasswordDto.email,
      {
        redirectTo,
        ...(forgotPasswordDto.captchaToken && {
          captchaToken: forgotPasswordDto.captchaToken,
        }),
      },
    );

    if (error) {
      // Rate-limit and captcha failures are real errors; everything else is
      // swallowed so we always return 200 and prevent enumeration.
      if (error.status === 429) {
        throw new BadRequestException(error.message);
      }
      if (forgotPasswordDto.captchaToken && /captcha/i.test(error.message)) {
        throw new BadRequestException(error.message);
      }
      this.logger.warn(
        `forgotPassword: suppressed Supabase error: ${error.message}`,
      );
    }
  }

  /**
   * Sets a new password using the recovery session JWT (already exchanged via
   * `/auth/validate`). Unlike `setPassword`, this is intended for users who
   * already have a password and need to replace it.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const jwt = resetPasswordDto.accessToken;

    const response = await fetchWithTimeout(
      `${this.supabaseUrl}/auth/v1/user`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${jwt}`,
          apikey: this.supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: resetPasswordDto.newPassword }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      const status = response.status;
      if (status === 401 || status === 403) {
        throw new ForbiddenException(`Failed to reset password: ${body}`);
      }
      throw new BadRequestException(`Failed to reset password: ${body}`);
    }
  }

  /**
   * Sends a 6-digit OTP code to the email for passwordless sign-in. Only
   * existing users are allowed (`shouldCreateUser: false`). Always resolves
   * successfully to avoid enumeration; rate-limit errors propagate.
   */
  async requestSignInOtp(dto: OtpSignInRequestDto): Promise<void> {
    const { error } = await this.supabaseClient.auth.signInWithOtp({
      email: dto.email,
      options: {
        shouldCreateUser: false,
        ...(dto.captchaToken && { captchaToken: dto.captchaToken }),
      },
    });

    if (error) {
      if (error.status === 429) {
        throw new BadRequestException(error.message);
      }
      if (dto.captchaToken && /captcha/i.test(error.message)) {
        throw new BadRequestException(error.message);
      }
      this.logger.warn(
        `requestSignInOtp: suppressed Supabase error: ${error.message}`,
      );
    }
  }

  /**
   * Verifies a 6-digit OTP and, on success, returns a session identical to a
   * password sign-in. Mirrors `signIn` for invite acceptance and locale sync.
   */
  async verifySignInOtp(dto: OtpSignInVerifyDto): Promise<AccessTokenDto> {
    const { data, error } = await this.supabaseClient.auth.verifyOtp({
      email: dto.email,
      token: dto.token,
      type: 'email',
    });

    if (error) {
      switch (error.status) {
        case 401:
        case 403:
          throw new ForbiddenException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    if (!data.user || !data.session) {
      throw new BadRequestException('Invalid or expired code');
    }

    const inviteOrgId = await this.acceptInviteForAuthUser(
      data.user?.id,
      dto.invite,
    );

    return {
      user: data.user,
      session: data.session,
      inviteOrgId,
    } as AccessTokenDto;
  }

  private generatePKCEVerifier(): string {
    return randomBytes(32).toString('hex');
  }

  private generatePKCEChallenge(verifier: string): string {
    const hash = createHash('sha256').update(verifier).digest('base64url');
    return hash;
  }
}
