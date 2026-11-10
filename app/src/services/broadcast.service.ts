import { ApiService } from "./api.service";

/**
 * REST write path for live broadcast state (controller → listeners).
 *
 * Replaces the former socket.io sender. Every call reads the current
 * Supabase access token from the auth store and automatically refreshes
 * and retries once on 401/403 (see ApiService.internalFetch), so broadcast
 * updates can no longer die silently on an expired token.
 *
 * Writes are serialized: rapid part/slide changes enqueue one PUT after
 * another instead of racing on parallel connections, which could otherwise
 * apply an older selection after a newer one.
 */
export class BroadcastService extends ApiService {

  private writeQueue: Promise<void> = Promise.resolve();

  private enqueue(write: () => Promise<void>): Promise<void> {
    const run = this.writeQueue.then(write, write);
    this.writeQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  public async setSchedule(sessionId: number, orgId: number, schedule: unknown[]): Promise<void> {
    if (this.isOffline()) {
      // Offline presenting is local-only (popup/second screen); there are no
      // socket listeners to reach, so skip the write silently instead of
      // spamming network failures on every schedule/selection change.
      return;
    }
    return this.enqueue(() => this.putRequest(`/sessions/${sessionId}/broadcast/schedule`, JSON.stringify({ schedule }), {
      'content-type': 'application/json',
      'Organization': orgId.toString(),
    }).then(() => undefined));
  }

  public async setScheduleItem(sessionId: number, orgId: number, scheduleItem: unknown): Promise<void> {
    if (this.isOffline()) {
      return;
    }
    return this.enqueue(() => this.putRequest(`/sessions/${sessionId}/broadcast/schedule-item`, JSON.stringify({ scheduleItem }), {
      'content-type': 'application/json',
      'Organization': orgId.toString(),
    }).then(() => undefined));
  }

  public async setSelection(sessionId: number, orgId: number, selection: unknown): Promise<void> {
    if (this.isOffline()) {
      return;
    }
    return this.enqueue(() => this.putRequest(`/sessions/${sessionId}/broadcast/selection`, JSON.stringify({ selection }), {
      'content-type': 'application/json',
      'Organization': orgId.toString(),
    }).then(() => undefined));
  }

}
