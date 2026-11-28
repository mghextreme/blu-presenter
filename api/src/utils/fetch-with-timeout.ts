import { GatewayTimeoutException } from '@nestjs/common';

/** Default deadline for calls to external services. */
export const OUTBOUND_TIMEOUT_MS = 10_000;

/**
 * `fetch` with a deadline, so a stalled upstream fails the request instead of
 * hanging it. A timeout rejects with a 504; other network errors are
 * rethrown as they are.
 */
export async function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs: number = OUTBOUND_TIMEOUT_MS,
): Promise<Response> {
  const deadline = AbortSignal.timeout(timeoutMs);
  const signal = init.signal
    ? AbortSignal.any([init.signal, deadline])
    : deadline;

  try {
    return await fetch(input, { ...init, signal });
  } catch (error) {
    if (deadline.aborted) {
      throw new GatewayTimeoutException(
        `${hostOf(input)} did not respond within ${timeoutMs} ms`,
      );
    }
    throw error;
  }
}

function hostOf(input: string | URL | Request): string {
  const url = input instanceof Request ? input.url : String(input);
  try {
    return new URL(url).host;
  } catch {
    return 'The upstream service';
  }
}
