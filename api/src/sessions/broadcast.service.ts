import { Injectable } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsGateway } from './sessions.gateway';
import { OrganizationsBaseService } from 'src/organizations/organizations.service';
import {
  sanitizeSchedule,
  sanitizeScheduleItem,
  sanitizeSelection,
} from 'src/utils/sanitizer';

@Injectable()
export class BroadcastService {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly organizationsBaseService: OrganizationsBaseService,
    private readonly sessionsGateway: SessionsGateway,
  ) {}

  async setSchedule(
    orgId: number,
    sessionId: number,
    schedule: any[],
  ): Promise<void> {
    await this.organizationsBaseService.assertFeatureEnabled(orgId, 'sessions');

    const sanitized =
      schedule && schedule.length > 0 ? sanitizeSchedule(schedule) : [];

    // Persist first so listeners only ever receive state that is also
    // returned by the periodic re-join resync. setSchedule throws
    // NotFoundException when the session does not belong to this org.
    await this.sessionsService.setSchedule(orgId, sessionId, sanitized);

    this.sessionsGateway.broadcastToSession(sessionId, 'schedule', sanitized);
  }

  async setScheduleItem(
    orgId: number,
    sessionId: number,
    scheduleItem: any,
  ): Promise<void> {
    await this.organizationsBaseService.assertFeatureEnabled(orgId, 'sessions');

    const sanitized = sanitizeScheduleItem(scheduleItem);
    await this.sessionsService.setScheduleItem(orgId, sessionId, sanitized);

    this.sessionsGateway.broadcastToSession(
      sessionId,
      'scheduleItem',
      sanitized,
    );
  }

  async setSelection(
    orgId: number,
    sessionId: number,
    selection: any,
  ): Promise<void> {
    await this.organizationsBaseService.assertFeatureEnabled(orgId, 'sessions');

    const sanitized = sanitizeSelection(selection);
    await this.sessionsService.setSelection(orgId, sessionId, sanitized);

    this.sessionsGateway.broadcastToSession(sessionId, 'selection', sanitized);
  }
}
