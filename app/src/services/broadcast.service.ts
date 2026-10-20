import { ApiService } from "./api.service";

/**
 * REST write path for live broadcast state (controller → listeners).
 *
 * Replaces the former socket.io sender. Every call reads the current
 * Supabase access token from the auth store and automatically refreshes
 * and retries once on 401/403 (see ApiService.internalFetch), so broadcast
 * updates can no longer die silently on an expired token.
 */
export class BroadcastService extends ApiService {

  public async setSchedule(sessionId: number, orgId: number, schedule: unknown[]): Promise<void> {
    await this.putRequest(`/sessions/${sessionId}/broadcast/schedule`, JSON.stringify({ schedule }), {
      'content-type': 'application/json',
      'Organization': orgId.toString(),
    });
  }

  public async setScheduleItem(sessionId: number, orgId: number, scheduleItem: unknown): Promise<void> {
    await this.putRequest(`/sessions/${sessionId}/broadcast/schedule-item`, JSON.stringify({ scheduleItem }), {
      'content-type': 'application/json',
      'Organization': orgId.toString(),
    });
  }

  public async setSelection(sessionId: number, orgId: number, selection: unknown): Promise<void> {
    await this.putRequest(`/sessions/${sessionId}/broadcast/selection`, JSON.stringify({ selection }), {
      'content-type': 'application/json',
      'Organization': orgId.toString(),
    });
  }

}
