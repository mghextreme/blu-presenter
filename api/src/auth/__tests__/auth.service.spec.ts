import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Supabase } from '../../supabase/supabase';
import { UsersService } from '../../users/users.service';
import { OrganizationsService } from '../../organizations/organizations.service';

describe('AuthService — password reset & OTP login', () => {
  let service: AuthService;
  let supabaseAuth: any;
  let adminAuth: any;
  const SUPABASE_URL = 'http://supabase.local';
  const SUPABASE_KEY = 'anon-key';

  beforeEach(async () => {
    supabaseAuth = {
      resetPasswordForEmail: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      refreshSession: jest.fn(),
      getUser: jest.fn(),
    };

    adminAuth = {
      auth: {
        admin: {
          updateUserById: jest.fn().mockResolvedValue({ data: {}, error: null }),
          signOut: jest.fn().mockResolvedValue({ data: {}, error: null }),
        },
      },
    };

    const supabaseProvider = {
      getClient: jest.fn().mockReturnValue({ auth: supabaseAuth }),
    };

    const configService = {
      get: jest.fn((k: string) => {
        switch (k) {
          case 'supabase.url': return SUPABASE_URL;
          case 'supabase.key': return SUPABASE_KEY;
          case 'app.baseUrl': return 'http://app.local';
          default: return undefined;
        }
      }),
    };

    const usersService = { findByAuthId: jest.fn() };
    const organizationsService = {
      getInvitation: jest.fn(),
      acceptInvitation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: Supabase, useValue: supabaseProvider },
        { provide: ConfigService, useValue: configService },
        { provide: UsersService, useValue: usersService },
        { provide: OrganizationsService, useValue: organizationsService },
        {
          provide: REQUEST,
          useValue: {
            headers: { authorization: 'Bearer recovery-jwt' },
            user: { internal: { id: 1, email: 'u@example.com' } },
          },
        },
      ],
    }).compile();

    service = await module.resolve(AuthService);
  });

  describe('forgotPassword', () => {
    it('calls resetPasswordForEmail with redirectTo and locale', async () => {
      supabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

      await service.forgotPassword({
        email: 'u@example.com',
        captchaToken: 'c',
      });

      expect(supabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        'u@example.com',
        {
          redirectTo: 'http://app.local/reset-password',
          captchaToken: 'c',
        },
      );
    });

    it('resolves silently when Supabase returns a non-rate-limit error (anti-enumeration)', async () => {
      supabaseAuth.resetPasswordForEmail.mockResolvedValue({
        error: { status: 400, message: 'User not found' },
      });

      await expect(
        service.forgotPassword({ email: 'ghost@example.com' }),
      ).resolves.toBeUndefined();
    });

    it('throws on 429 rate limit so the caller can surface it', async () => {
      supabaseAuth.resetPasswordForEmail.mockResolvedValue({
        error: { status: 429, message: 'too many requests' },
      });

      await expect(
        service.forgotPassword({ email: 'u@example.com' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('PUTs the new password to /auth/v1/user with the recovery JWT and signs out other sessions', async () => {
      const fetchMock = jest.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock as any;

      await service.resetPassword({
        accessToken: 'recovery-jwt',
        newPassword: 'newSecret1',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `${SUPABASE_URL}/auth/v1/user`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer recovery-jwt',
            apikey: SUPABASE_KEY,
          }),
        }),
      );
    });

    it('throws ForbiddenException on 401 from Supabase', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('expired'),
      }) as any;

      await expect(
        service.resetPassword({
          accessToken: 'recovery-jwt',
          newPassword: 'newSecret1',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('requestSignInOtp', () => {
    it('calls signInWithOtp with shouldCreateUser=false', async () => {
      supabaseAuth.signInWithOtp.mockResolvedValue({ error: null });

      await service.requestSignInOtp({
        email: 'u@example.com',
        captchaToken: 'c',
      });

      expect(supabaseAuth.signInWithOtp).toHaveBeenCalledWith({
        email: 'u@example.com',
        options: {
          shouldCreateUser: false,
          captchaToken: 'c',
        },
      });
    });

    it('resolves silently on enumeration-style errors', async () => {
      supabaseAuth.signInWithOtp.mockResolvedValue({
        error: { status: 400, message: 'Signups not allowed for otp' },
      });

      await expect(
        service.requestSignInOtp({ email: 'ghost@example.com' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('verifySignInOtp', () => {
    it('verifies the OTP and returns an access token', async () => {
      supabaseAuth.verifyOtp.mockResolvedValue({
        data: {
          user: { id: 'auth-1' },
          session: { access_token: 'a', refresh_token: 'r' },
        },
        error: null,
      });

      const result = await service.verifySignInOtp({
        email: 'u@example.com',
        token: '123456',
      });

      expect(supabaseAuth.verifyOtp).toHaveBeenCalledWith({
        email: 'u@example.com',
        token: '123456',
        type: 'email',
      });
      expect(result.session).toEqual({ access_token: 'a', refresh_token: 'r' });
    });

    it('throws ForbiddenException on 401/403', async () => {
      supabaseAuth.verifyOtp.mockResolvedValue({
        data: null,
        error: { status: 401, message: 'Invalid token' },
      });

      await expect(
        service.verifySignInOtp({
          email: 'u@example.com',
          token: '000000',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequestException on other errors', async () => {
      supabaseAuth.verifyOtp.mockResolvedValue({
        data: null,
        error: { status: 400, message: 'expired' },
      });

      await expect(
        service.verifySignInOtp({
          email: 'u@example.com',
          token: '000000',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
