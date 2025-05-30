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
import { OrganizationsService } from 'src/organizations/organizations.service';
import { Supabase } from 'src/supabase/supabase';
import {
  AccessTokenDto,
  AuthDto,
  ChangePasswordDto,
  OAuthRedirectDto,
  SignInDto,
  SignUpDto,
  TokenRefreshDto,
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
      await this.supabaseClient.auth.signInWithPassword(signInDto);

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
}
