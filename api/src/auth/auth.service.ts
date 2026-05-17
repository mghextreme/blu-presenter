import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { Supabase } from 'src/supabase/supabase';
import {
  AccessTokenDto,
  AuthDto,
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

@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  public supabaseClient: SupabaseClient;

  constructor(
    @Inject(Supabase)
    private readonly supabase: Supabase,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(OrganizationsService)
    readonly organizationsService: OrganizationsService,
    @Inject(REQUEST)
    private readonly request: ExpRequest,
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
    const { data, error } =
      await this.supabaseClient.auth.signInWithPassword({
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

    await this.syncUserLocale(data.user?.id, signInDto.locale, data.user?.user_metadata?.locale);

    let inviteOrgId = undefined;
    if (signInDto.invite) {
      try {
        const invite = await this.organizationsService.getInvitation(
          signInDto.invite.id,
          signInDto.invite.secret,
        );

        const user = await this.usersService.findByAuthId(data.user.id);
        if (!this.request.user) {
          this.request.user = {};
        }
        this.request.user['internal'] = user;

        await this.organizationsService.acceptInvitation(invite.id);
        inviteOrgId = invite.orgId;
      } catch (e) {
        console.warn(`Error accepting invite: ${e}`);
      }
    }

    return {
      user: data.user,
      session: data.session,
      inviteOrgId: inviteOrgId,
    } as AccessTokenDto;
  }

  async signInWithProvider(provider: string, authDto?: AuthDto): Promise<OAuthRedirectDto> {
    switch (provider) {
      case 'google':
        const redirectTo = this.configService.get('app.baseUrl') + '/oauth/callback';
        const codeVerifier = this.generatePKCEVerifier();
        const codeChallenge = this.generatePKCEChallenge(codeVerifier);

        const params = new URLSearchParams({
          provider,
          redirect_to: redirectTo,
          code_challenge: codeChallenge,
          code_challenge_method: 's256',
        });

        const response = await fetch(
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
          throw new BadRequestException(`Failed to initiate OAuth sign-in: ${body}`);
        }

        return { url, codeVerifier };
    }

    throw new BadRequestException(`Provider ${provider} not supported for sign in`);
  }

  async exchangeCodeForSession(code: string, codeVerifier: string): Promise<AccessTokenDto> {
    const response = await fetch(
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
      throw new BadRequestException(`Failed to exchange code for session: ${body}`);
    }

    const data = await response.json();

    return {
      user: data.user,
      session: { access_token: data.access_token, refresh_token: data.refresh_token, ...data },
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

    let inviteOrgId = undefined;
    if (signUpDto.invite) {
      try {
        const invite = await this.organizationsService.getInvitation(
          signUpDto.invite.id,
          signUpDto.invite.secret,
        );

        const user = await this.usersService.findByAuthId(data.user.id);
        if (!this.request.user) {
          this.request.user = {};
        }
        this.request.user['internal'] = user;

        await this.organizationsService.acceptInvitation(invite.id);
        inviteOrgId = invite.orgId;
      } catch (e) {
        console.warn(`Error accepting invite: ${e}`);
      }
    }

    return {
      user: data.user,
      session: data.session,
      inviteOrgId: inviteOrgId,
    } as AccessTokenDto;
  }

  async tokenRefresh(tokenRefreshDto: TokenRefreshDto): Promise<AccessTokenDto> {
    const { data, error } = await this.supabaseClient.auth.refreshSession({ refresh_token: tokenRefreshDto.refreshToken });

    if (error) {
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
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = this.request.user['internal'] as User;
    const { error: authError } =
      await this.supabaseClient.auth.signInWithPassword({
        email: user.email,
        password: changePasswordDto.currentPassword,
      });

    if (authError) {
      throw new ForbiddenException(authError.message);
    }

    const jwt = this.extractJwt();
    const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: this.supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: changePasswordDto.newPassword }),
    });

    if (!response.ok) {
      const body = await response.text();
      const status = response.status;
      if (status === 401 || status === 403) {
        throw new ForbiddenException(`Failed to update password: ${body}`);
      }
      throw new BadRequestException(`Failed to update password: ${body}`);
    }

    // Invalidate every session except the current one, in case the user is
    // changing their password because they suspect a compromise.
    await this.signOutOtherSessions(jwt);
  }

  async getIdentities(): Promise<UserIdentitiesResponseDto> {
    const jwt = this.extractJwt();

    const { data, error } = await this.supabaseClient.auth.getUser(jwt);
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

  async linkIdentity(provider: string): Promise<OAuthRedirectDto> {
    switch (provider) {
      case 'google':
        break;
      default:
        throw new BadRequestException(
          `Provider ${provider} not supported for identity linking`,
        );
    }

    const jwt = this.extractJwt();
    const supabaseUrl = this.configService.get('supabase.url');
    const supabaseKey = this.configService.get('supabase.key');
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

    const response = await fetch(
      `${supabaseUrl}/auth/v1/user/identities/authorize?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
          apikey: supabaseKey,
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

    return {
      url: data.url,
      codeVerifier: `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token-code-verifier=${codeVerifier}`,
    };
  }

  async unlinkIdentity(identityId: string): Promise<void> {
    const jwt = this.extractJwt();

    // Verify the user has more than one identity before unlinking
    const { identities } = await this.getIdentities();
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

    const supabaseUrl = this.configService.get('supabase.url');
    const supabaseKey = this.configService.get('supabase.key');

    const response = await fetch(
      `${supabaseUrl}/auth/v1/user/identities/${identityId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${jwt}`,
          apikey: supabaseKey,
        },
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        `Failed to unlink identity: ${body}`,
      );
    }
  }

  async setPassword(setPasswordDto: SetPasswordDto): Promise<void> {
    const jwt = this.extractJwt();

    // Verify user doesn't already have a password
    const { hasPassword } = await this.getIdentities();
    if (hasPassword) {
      throw new BadRequestException(
        'User already has a password. Use changePassword instead.',
      );
    }

    const supabaseUrl = this.configService.get('supabase.url');
    const supabaseKey = this.configService.get('supabase.key');

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: setPasswordDto.newPassword }),
    });

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
    const redirectTo = this.configService.get('app.baseUrl') + '/reset-password';

    const { error } = await this.supabaseClient.auth.resetPasswordForEmail(
      forgotPasswordDto.email,
      {
        redirectTo,
        ...(forgotPasswordDto.captchaToken && {
          captchaToken: forgotPasswordDto.captchaToken,
        }),
        // Locale is read by the recovery email template via `{{ .Data.locale }}`
        ...(forgotPasswordDto.locale && {
          data: { locale: forgotPasswordDto.locale },
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
      console.warn(`forgotPassword: suppressed Supabase error: ${error.message}`);
    }
  }

  /**
   * Sets a new password using the recovery session JWT (already exchanged via
   * `/auth/validate`). Unlike `setPassword`, this is intended for users who
   * already have a password and need to replace it. Invalidates every other
   * active session on success.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const jwt = resetPasswordDto.accessToken;

    const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: this.supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: resetPasswordDto.newPassword }),
    });

    if (!response.ok) {
      const body = await response.text();
      const status = response.status;
      if (status === 401 || status === 403) {
        throw new ForbiddenException(`Failed to reset password: ${body}`);
      }
      throw new BadRequestException(`Failed to reset password: ${body}`);
    }

    await this.signOutOtherSessions(jwt);
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
        // For existing users, Supabase reads locale from `user_metadata` (set
        // at sign-up or kept in sync via `syncUserLocale`). The `data` here is
        // only honored for new users, which we don't allow, but we pass it for
        // forward-compatibility.
        ...(dto.locale && { data: { locale: dto.locale } }),
      },
    });

    if (error) {
      if (error.status === 429) {
        throw new BadRequestException(error.message);
      }
      if (dto.captchaToken && /captcha/i.test(error.message)) {
        throw new BadRequestException(error.message);
      }
      console.warn(`requestSignInOtp: suppressed Supabase error: ${error.message}`);
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

    await this.syncUserLocale(data.user.id, dto.locale, data.user.user_metadata?.locale);

    let inviteOrgId: number | undefined = undefined;
    if (dto.invite) {
      try {
        const invite = await this.organizationsService.getInvitation(
          dto.invite.id,
          dto.invite.secret,
        );

        const user = await this.usersService.findByAuthId(data.user.id);
        if (!this.request.user) {
          this.request.user = {};
        }
        this.request.user['internal'] = user;

        await this.organizationsService.acceptInvitation(invite.id);
        inviteOrgId = invite.orgId;
      } catch (e) {
        console.warn(`Error accepting invite: ${e}`);
      }
    }

    return {
      user: data.user,
      session: data.session,
      inviteOrgId,
    } as AccessTokenDto;
  }

  /**
   * Updates the Supabase user's `user_metadata.locale` when it differs from
   * the locale the frontend reported. Requires the service role key; degrades
   * silently when unavailable (local dev without admin key).
   */
  private async syncUserLocale(
    userId: string | undefined,
    requestedLocale: string | undefined,
    currentLocale: string | undefined,
  ): Promise<void> {
    if (!userId || !requestedLocale || requestedLocale === currentLocale) {
      return;
    }

    const admin = this.supabase.getAdminClient();
    if (!admin) {
      // Without the admin key we can't update metadata server-side. Acceptable
      // in local dev; in production the env var should always be set.
      return;
    }

    try {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: { locale: requestedLocale },
      });
      if (error) {
        console.warn(`syncUserLocale: ${error.message}`);
      }
    } catch (e) {
      console.warn(`syncUserLocale: ${e}`);
    }
  }

  /**
   * Invalidates every session for the current user except the one belonging to
   * the supplied JWT. Used after password change/reset to evict potentially
   * compromised sessions. Requires the service role key; degrades silently
   * when unavailable.
   */
  private async signOutOtherSessions(currentJwt: string): Promise<void> {
    const admin = this.supabase.getAdminClient();
    if (!admin) {
      return;
    }

    try {
      const { error } = await admin.auth.admin.signOut(currentJwt, 'others');
      if (error) {
        console.warn(`signOutOtherSessions: ${error.message}`);
      }
    } catch (e) {
      console.warn(`signOutOtherSessions: ${e}`);
    }
  }

  private extractJwt(): string {
    const authHeader = this.request.headers.authorization;
    if (!authHeader) {
      throw new ForbiddenException('No authorization header');
    }
    return authHeader.replace('Bearer ', '');
  }

  private generatePKCEVerifier(): string {
    return randomBytes(32).toString('hex');
  }

  private generatePKCEChallenge(verifier: string): string {
    const hash = createHash('sha256').update(verifier).digest('base64url');
    return hash;
  }
}
