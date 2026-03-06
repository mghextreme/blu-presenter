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
  OAuthRedirectDto,
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
    let redirectTo = this.configService.get('app.baseUrl') + '/oauth/callback';

    switch (provider) {
      case 'google':
        const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams: {
              access_type: 'online',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          throw new BadRequestException(error.message);
        }

        if (data.url) {
          return {
            url: data.url,
            codeVerifier: this.supabase.cookieValues['auth-token-code-verifier'],
          };
        }
    }

    throw new BadRequestException(`Provider ${provider} not supported for sign in`)
  }

  async exchangeCodeForSession(code: string, codeVerifier: string): Promise<AccessTokenDto> {
    const bits = codeVerifier.split('=');
    this.supabase.cookieValues[bits[0]] = bits[1];
    const { data, error } = await this.supabaseClient.auth.exchangeCodeForSession(code);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      user: data.user,
      session: data.session,
    } as AccessTokenDto;
  }

  async signUp(signUpDto: SignUpDto): Promise<AccessTokenDto> {
    const { data, error } = await this.supabaseClient.auth.signUp({
      ...signUpDto,
      options: {
        emailRedirectTo: this.configService.get('app.baseUrl') + '/app',
        ...(signUpDto.captchaToken && { captchaToken: signUpDto.captchaToken }),
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

    const { error } = await this.supabaseClient.auth.updateUser({
      password: changePasswordDto.newPassword,
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
