import { SessionsGateway } from '../sessions.gateway';

describe('SessionsGateway handleJoinRoom', () => {
  let gateway: SessionsGateway;
  let sessionsService: { findOneBySecret: jest.Mock };
  let organizationsBaseService: { isFeatureEnabledInOrg: jest.Mock };

  const buildClient = (rooms: string[] = []) =>
    ({
      rooms: new Set(rooms),
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
    }) as any;

  beforeEach(() => {
    sessionsService = {
      findOneBySecret: jest.fn(),
    };
    organizationsBaseService = {
      isFeatureEnabledInOrg: jest.fn().mockResolvedValue(true),
    };
    gateway = new SessionsGateway(
      sessionsService as any,
      organizationsBaseService as any,
    );
  });

  it('joins the room and echoes the stored session state on a valid secret', async () => {
    const session = {
      schedule: [{ id: 1 }],
      scheduleItem: { id: 1, title: 'Amazing Grace' },
      selection: { scheduleItem: 0, slide: 0, part: 2 },
    };
    sessionsService.findOneBySecret.mockResolvedValue(session);

    const client = buildClient(['session:99']);
    await gateway.handleJoinRoom(client as any, {
      orgId: 3,
      sessionId: 7,
      secret: 'correct-secret',
    });

    expect(organizationsBaseService.isFeatureEnabledInOrg).toHaveBeenCalledWith(
      3,
      'sessions',
    );
    expect(sessionsService.findOneBySecret).toHaveBeenCalledWith(
      3,
      7,
      'correct-secret',
    );
    expect(client.leave).toHaveBeenCalledWith('session:99');
    expect(client.join).toHaveBeenCalledWith('session:7');
    expect(client.emit).toHaveBeenCalledWith(
      'joinedSession',
      expect.objectContaining({
        id: 7,
        schedule: session.schedule,
        scheduleItem: session.scheduleItem,
        selection: session.selection,
      }),
    );
  });

  it('reports session.notFound when the secret does not match', async () => {
    sessionsService.findOneBySecret.mockResolvedValue(null);

    const client = buildClient();
    await gateway.handleJoinRoom(client as any, {
      orgId: 3,
      sessionId: 7,
      secret: 'wrong-secret',
    });

    expect(client.emit).toHaveBeenCalledWith('error', {
      code: 'session.notFound',
      message: 'Session not found',
    });
    expect(client.join).not.toHaveBeenCalled();
  });

  it('reports session.disabled when the feature is off', async () => {
    organizationsBaseService.isFeatureEnabledInOrg.mockResolvedValue(false);

    const client = buildClient();
    await gateway.handleJoinRoom(client as any, {
      orgId: 3,
      sessionId: 7,
      secret: 'correct-secret',
    });

    expect(client.emit).toHaveBeenCalledWith('error', {
      code: 'session.disabled',
      message: 'Sessions are disabled for this organization',
    });
  });

  it('reports join.failed instead of crashing when the underlying checks fail', async () => {
    organizationsBaseService.isFeatureEnabledInOrg.mockRejectedValue(
      new Error('db unavailable'),
    );

    const client = buildClient();
    await gateway.handleJoinRoom(client as any, {
      orgId: 3,
      sessionId: 7,
      secret: 'correct-secret',
    });

    expect(client.emit).toHaveBeenCalledWith('error', {
      code: 'join.failed',
      message: 'Failed to join session',
    });
    expect(client.join).not.toHaveBeenCalled();
  });

  it('rejects payloads without orgId or sessionId', async () => {
    const client = buildClient();
    await gateway.handleJoinRoom(client as any, {} as any);

    expect(client.emit).toHaveBeenCalledWith('error', {
      code: 'missing.orgId',
      message: 'Organization id is required',
    });
    expect(sessionsService.findOneBySecret).not.toHaveBeenCalled();
    expect(
      organizationsBaseService.isFeatureEnabledInOrg,
    ).not.toHaveBeenCalled();
  });
});
