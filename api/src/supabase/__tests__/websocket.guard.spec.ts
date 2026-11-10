import { WebsocketGuard } from '../supabase.guard';

describe('WebsocketGuard', () => {
  let jwt: { verifyToken: jest.Mock };
  let users: { findByAuthId: jest.Mock };
  let organizations: {
    isFeatureEnabledInOrg: jest.Mock;
    userRole: jest.Mock;
  };
  let sessions: { findOne: jest.Mock };
  let guard: WebsocketGuard;

  const buildContext = (
    client: Record<string, any>,
    data: Record<string, any>,
  ) => ({
    switchToWs: () => ({
      getClient: () => client,
      getData: () => data,
    }),
  });

  beforeEach(() => {
    jwt = { verifyToken: jest.fn().mockRejectedValue(new Error('invalid')) };
    users = { findByAuthId: jest.fn() };
    organizations = {
      isFeatureEnabledInOrg: jest.fn().mockResolvedValue(true),
      userRole: jest.fn().mockResolvedValue('owner'),
    };
    sessions = { findOne: jest.fn() };
    guard = new WebsocketGuard(
      jwt as any,
      users as any,
      organizations as any,
      sessions as any,
    );
  });

  it('allows reusing the joined session without re-verification', async () => {
    const client = { userId: 1, orgId: 3, sessionId: 7 };
    // Same shape the leaveSession handler sends: sessionId only
    const context = buildContext(client, { sessionId: 7 });

    await expect(guard.canActivate(context as any)).resolves.toBe(true);
    expect(jwt.verifyToken).not.toHaveBeenCalled();
    expect(sessions.findOne).not.toHaveBeenCalled();
  });

  it('still requires the join payload org id to match the joined one', async () => {
    const client = { userId: 1, orgId: 3, sessionId: 7 };
    const context = buildContext(client, { orgId: 42, sessionId: 7 });

    await expect(guard.canActivate(context as any)).resolves.toBe(false);
    expect(jwt.verifyToken).toHaveBeenCalled();
  });

  it('falls back to the client org id when joining fresh', async () => {
    // Fresh socket with a handshake token: the token path must not query
    // the database with an undefined orgId
    const client: Record<string, any> = {
      handshake: { auth: { token: 'tkn' } },
    };
    jwt.verifyToken.mockResolvedValue({ sub: 'auth-uuid' });
    users.findByAuthId.mockResolvedValue({ id: 1 });
    sessions.findOne.mockResolvedValue({ id: 7, orgId: 3 });
    organizations.userRole.mockResolvedValue('owner');

    const context = buildContext(client, { orgId: 3, sessionId: 7 });

    await expect(guard.canActivate(context as any)).resolves.toBe(true);
    expect(sessions.findOne).toHaveBeenCalledWith(3, 7);
    expect(client.userId).toBe(1);
    expect(client.orgId).toBe(3);
    expect(client.sessionId).toBe(7);
  });

  it('rejects a verifyable client that never joined and carries no org id', async () => {
    // e.g. leaveSession without having joined first: nothing to leave and
    // no org id to look up — reject instead of hitting the database blind
    const client: Record<string, any> = {
      handshake: { auth: { token: 'tkn' } },
    };
    jwt.verifyToken.mockResolvedValue({ sub: 'auth-uuid' });
    users.findByAuthId.mockResolvedValue({ id: 1 });

    const context = buildContext(client, { sessionId: 7 });

    await expect(guard.canActivate(context as any)).resolves.toBe(false);
    expect(sessions.findOne).not.toHaveBeenCalled();
  });

  it('rejects a payload referencing an unjoined session without a token', async () => {
    const context = buildContext({}, { orgId: 42, sessionId: 7 });

    await expect(guard.canActivate(context as any)).resolves.toBe(false);
    expect(sessions.findOne).not.toHaveBeenCalled();
  });
});
