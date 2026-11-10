import { UnauthorizedException } from '@nestjs/common';
import { SupabaseGuard } from '../supabase.guard';
import { IS_PUBLIC_KEY } from '../public.decorator';

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
  let organizationService: Record<string, unknown>;
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

  it('skips the WS passport strategy and lets WS gateways use their own guards', async () => {
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
});
