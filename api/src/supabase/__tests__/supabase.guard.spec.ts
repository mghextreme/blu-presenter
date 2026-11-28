import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SupabaseGuard } from '../supabase.guard';
import { IS_PUBLIC_KEY } from '../public.decorator';
import { ORGANIZATION_ROLE_KEY } from '../../auth/organization-role.decorator';

/**
 * Simulates the passport base guard the same way it behaves at runtime.
 * On a WS execution context the "request" has no HTTP headers, so the JWT
 * strategy cannot extract a token and the base guard rejects.
 */
const baseCanActivate = jest.fn();
jest.mock('@nestjs/passport', () => ({
  AuthGuard: () =>
    class MockBaseAuthGuard {
      public async canActivate(_context: unknown): Promise<boolean> {
        return baseCanActivate(_context);
      }
    },
}));

describe('SupabaseGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let userService: { findByAuthId: jest.Mock };
  let organizationService: { userRole?: jest.Mock };
  const handler = () => undefined;
  const cls = class Target {};

  const buildContext = ({ type, request }: { type: string; request?: any }) =>
    ({
      getType: () => type,
      getHandler: () => handler,
      getClass: () => cls,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as any;

  beforeEach(() => {
    baseCanActivate.mockReset();
    reflector = {
      getAllAndOverride: jest.fn(
        (key: string) => key === IS_PUBLIC_KEY && false,
      ) as any,
    };
    userService = {
      findByAuthId: jest.fn().mockResolvedValue({ id: 9, email: 'x@x' }),
    };
    organizationService = {};
  });

  it('skips the passport strategy on WS handlers', async () => {
    const guard = new SupabaseGuard(
      reflector as any,
      userService as any,
      organizationService as any,
    );

    const wsContext = buildContext({ type: 'ws' });
    await expect(guard.canActivate(wsContext)).resolves.toBe(true);
    expect(baseCanActivate).not.toHaveBeenCalled();
  });

  it('still authenticates HTTP requests through the passport strategy', async () => {
    baseCanActivate.mockResolvedValue(true);

    const guard = new SupabaseGuard(
      reflector as any,
      userService as any,
      organizationService as any,
    );

    const httpContext = buildContext({
      type: 'http',
      request: { user: { sub: 'auth-uuid' } },
    });
    await expect(guard.canActivate(httpContext)).resolves.toBe(true);
    expect(baseCanActivate).toHaveBeenCalledWith(httpContext);
    expect(userService.findByAuthId).toHaveBeenCalledWith('auth-uuid');
  });

  it('throws UnauthorizedException when the HTTP strategy rejects a non-public handler', async () => {
    baseCanActivate.mockRejectedValue(new Error('no auth token'));

    const guard = new SupabaseGuard(
      reflector as any,
      userService as any,
      organizationService as any,
    );

    const httpContext = buildContext({ type: 'http', request: {} });
    await expect(guard.canActivate(httpContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('accepts public HTTP handlers even when the strategy rejects', async () => {
    baseCanActivate.mockRejectedValue(new Error('no auth token'));
    reflector.getAllAndOverride = jest.fn(() => true) as any;

    const guard = new SupabaseGuard(
      reflector as any,
      userService as any,
      organizationService as any,
    );

    const httpContext = buildContext({ type: 'http', request: {} });
    await expect(guard.canActivate(httpContext)).resolves.toBe(true);
  });

  describe('on @OrganizationRole routes', () => {
    const buildGuard = () =>
      new SupabaseGuard(
        reflector as any,
        userService as any,
        organizationService as any,
      );

    beforeEach(() => {
      baseCanActivate.mockResolvedValue(true);
      reflector.getAllAndOverride = jest.fn((key: string) =>
        key === ORGANIZATION_ROLE_KEY ? ['owner', 'admin'] : false,
      ) as any;
      organizationService = { userRole: jest.fn().mockResolvedValue('admin') };
    });

    it('sets the parsed organization and role for an allowed role', async () => {
      const request: any = {
        user: { sub: 'auth-uuid' },
        headers: { organization: '5' },
      };

      await expect(
        buildGuard().canActivate(buildContext({ type: 'http', request })),
      ).resolves.toBe(true);
      expect(organizationService.userRole).toHaveBeenCalledWith(5, 9);
      expect(request.user).toMatchObject({
        internal: { id: 9 },
        organization: 5,
        role: 'admin',
      });
    });

    it('denies a role that is not allowed', async () => {
      organizationService.userRole!.mockResolvedValue('member');
      const request: any = {
        user: { sub: 'auth-uuid' },
        headers: { organization: '5' },
      };

      await expect(
        buildGuard().canActivate(buildContext({ type: 'http', request })),
      ).resolves.toBe(false);
      expect(request.user.organization).toBeUndefined();
    });

    it('denies a request without the Organization header', async () => {
      const request = { user: { sub: 'auth-uuid' }, headers: {} };

      await expect(
        buildGuard().canActivate(buildContext({ type: 'http', request })),
      ).resolves.toBe(false);
    });

    it.each(['abc', '1.5', '-2'])(
      'rejects a malformed Organization header (%s)',
      async (header) => {
        const request = {
          user: { sub: 'auth-uuid' },
          headers: { organization: header },
        };

        await expect(
          buildGuard().canActivate(buildContext({ type: 'http', request })),
        ).rejects.toThrow(BadRequestException);
        expect(organizationService.userRole).not.toHaveBeenCalled();
      },
    );
  });
});
