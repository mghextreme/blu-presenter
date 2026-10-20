import { BroadcastService } from '../broadcast.service';
import { NotFoundException } from '@nestjs/common';

describe('BroadcastService', () => {
  let service: BroadcastService;
  let sessionsService: {
    setSchedule: jest.Mock;
    setScheduleItem: jest.Mock;
    setSelection: jest.Mock;
  };
  let organizationsBaseService: { assertFeatureEnabled: jest.Mock };
  let sessionsGateway: { broadcastToSession: jest.Mock };

  beforeEach(() => {
    sessionsService = {
      setSchedule: jest.fn().mockResolvedValue(undefined),
      setScheduleItem: jest.fn().mockResolvedValue(undefined),
      setSelection: jest.fn().mockResolvedValue(undefined),
    };
    organizationsBaseService = {
      assertFeatureEnabled: jest.fn().mockResolvedValue(undefined),
    };
    sessionsGateway = { broadcastToSession: jest.fn() };
    service = new BroadcastService(
      sessionsService as any,
      organizationsBaseService as any,
      sessionsGateway as any,
    );
  });

  it('sanitizes, persists, then fans the schedule out to the session room', async () => {
    const rawSchedule = [
      {
        id: 1,
        title: 'Amazing Grace',
        secret: 'should-be-stripped',
        slides: [{ id: 's1' }],
      },
    ];

    await service.setSchedule(3, 7, rawSchedule);

    expect(organizationsBaseService.assertFeatureEnabled).toHaveBeenCalledWith(
      3,
      'sessions',
    );

    const persistCall = sessionsService.setSchedule.mock.calls[0];
    expect(persistCall[0]).toBe(3);
    expect(persistCall[1]).toBe(7);
    expect(persistCall[2]).toEqual([
      {
        id: 1,
        index: undefined,
        title: 'Amazing Grace',
        artist: undefined,
        language: undefined,
        blocks: undefined,
        slides: [{ id: 's1' }],
        uniqueId: undefined,
      },
    ]);

    // The fan-out must carry the exact persisted payload
    expect(sessionsGateway.broadcastToSession).toHaveBeenCalledTimes(1);
    expect(sessionsGateway.broadcastToSession).toHaveBeenCalledWith(
      7,
      'schedule',
      persistCall[2],
    );

    // Persist BEFORE broadcast: listeners only ever see persisted state
    expect(
      sessionsService.setSchedule.mock.invocationCallOrder[0],
    ).toBeLessThan(
      sessionsGateway.broadcastToSession.mock.invocationCallOrder[0],
    );
  });

  it('maps an empty or missing schedule to an empty list', async () => {
    await service.setSchedule(3, 7, []);
    expect(sessionsService.setSchedule).toHaveBeenCalledWith(3, 7, []);
    expect(sessionsGateway.broadcastToSession).toHaveBeenCalledWith(
      7,
      'schedule',
      [],
    );
  });

  it('sanitizes and fans out the schedule item', async () => {
    await service.setScheduleItem(3, 7, {
      id: 12,
      title: 'Item',
      secret: 'strip-me',
    });

    const persistCall = sessionsService.setScheduleItem.mock.calls[0];
    expect(persistCall[0]).toBe(3);
    expect(persistCall[1]).toBe(7);
    expect(persistCall[2].secret).toBeUndefined();
    expect(persistCall[2].id).toBe(12);
    expect(sessionsGateway.broadcastToSession).toHaveBeenCalledWith(
      7,
      'scheduleItem',
      persistCall[2],
    );
  });

  it('sanitizes and fans out the selection', async () => {
    await service.setSelection(3, 7, {
      scheduleItem: 0,
      slide: 2,
      part: 1,
      extra: 'stripped',
    });

    expect(sessionsService.setSelection).toHaveBeenCalledWith(3, 7, {
      scheduleItem: 0,
      slide: 2,
      part: 1,
    });
    expect(sessionsGateway.broadcastToSession).toHaveBeenCalledWith(
      7,
      'selection',
      { scheduleItem: 0, slide: 2, part: 1 },
    );
  });

  it('does not fan out when persistence fails', async () => {
    sessionsService.setSelection.mockRejectedValue(new NotFoundException());

    await expect(
      service.setSelection(3, 7, { scheduleItem: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(sessionsGateway.broadcastToSession).not.toHaveBeenCalled();
  });

  it('checks the sessions feature flag before persisting', async () => {
    organizationsBaseService.assertFeatureEnabled.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(service.setSchedule(3, 7, [])).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(sessionsService.setSchedule).not.toHaveBeenCalled();
    expect(sessionsGateway.broadcastToSession).not.toHaveBeenCalled();
  });
});
