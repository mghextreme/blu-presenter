import { ApiService } from './api.service';

/** A stalled write is abandoned after this long so it can't block the queue. */
const WRITE_TIMEOUT_MS = 10_000;

interface QueuedWrite {
  /** Identifies the state being written (session + kind of state). */
  key: string;
  run: () => Promise<unknown>;
  resolve: () => void;
  reject: (error: unknown) => void;
}

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
 * apply an older selection after a newer one. A queued write that hasn't
 * started yet is superseded by a newer write of the same state (only the
 * latest selection matters), and a stalled write times out, so a slow
 * request can neither pile up a backlog nor freeze live updates.
 */
export class BroadcastService extends ApiService {
  private queue: QueuedWrite[] = [];
  private draining = false;

  private enqueue(key: string, run: () => Promise<unknown>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Superseded writes resolve: their state is replaced by this newer one.
      for (const write of this.queue) {
        if (write.key === key) write.resolve();
      }
      this.queue = this.queue.filter((write) => write.key !== key);
      this.queue.push({ key, run, resolve, reject });
      void this.drain();
    });
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      let next = this.queue.shift();
      while (next) {
        try {
          await withTimeout(next.run(), WRITE_TIMEOUT_MS);
          next.resolve();
        } catch (e) {
          next.reject(e);
        }
        next = this.queue.shift();
      }
    } finally {
      this.draining = false;
    }
  }

  private write(sessionId: number, orgId: number, kind: string, body: unknown): Promise<void> {
    if (this.isOffline()) {
      // Offline presenting is local-only (popup/second screen); there are no
      // listeners to reach, so skip the writes instead of queueing or
      // spamming network failures on every schedule/selection change.
      return Promise.resolve();
    }
    return this.enqueue(`${sessionId}:${kind}`, () =>
      this.putRequest(`/sessions/${sessionId}/broadcast/${kind}`, JSON.stringify(body), {
        'content-type': 'application/json',
        Organization: orgId.toString(),
      }),
    );
  }

  public async setSchedule(sessionId: number, orgId: number, schedule: unknown[]): Promise<void> {
    return this.write(sessionId, orgId, 'schedule', { schedule });
  }

  public async setScheduleItem(
    sessionId: number,
    orgId: number,
    scheduleItem: unknown,
  ): Promise<void> {
    return this.write(sessionId, orgId, 'schedule-item', { scheduleItem });
  }

  public async setSelection(sessionId: number, orgId: number, selection: unknown): Promise<void> {
    return this.write(sessionId, orgId, 'selection', { selection });
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Broadcast write timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
