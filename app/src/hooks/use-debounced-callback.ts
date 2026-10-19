import { useCallback, useEffect, useRef } from "react";

const argsEqual = <A extends unknown[]>(a: A | null, b: A): boolean =>
  a !== null && a.length === b.length && a.every((arg, i) => Object.is(arg, b[i]));

/**
 * Wraps a callback with an optional debounce and duplicate suppression.
 *
 * - `queue(args)` schedules the callback to run after `delayMs` of inactivity;
 *   each call reschedules the pending timer. Without `delayMs` it does
 *   nothing. Calls whose arguments equal the arguments of the last execution
 *   are ignored, so re-renders and repeated submits never re-trigger the
 *   callback. The first queued call (typically the initial value, queued on
 *   mount) is treated as already handled and does not run the callback.
 * - `flush(args)` runs the callback immediately, cancelling any pending
 *   execution. The same duplicate suppression applies.
 *
 * The callback may change between renders; the latest version is always used.
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delayMs?: number,
): { queue: (...args: A) => void; flush: (...args: A) => void } {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Arguments of the last execution, starting with the initial value (the
  // first queued call is treated as already executed).
  const lastExecutedRef = useRef<A | null>(null);
  const isFirstQueueRef = useRef(true);

  // Never execute after unmount.
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const execute = useCallback((...args: A) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastExecutedRef.current = args;
    callbackRef.current(...args);
  }, []);

  const queue = useCallback(
    (...args: A) => {
      if (isFirstQueueRef.current) {
        isFirstQueueRef.current = false;
        lastExecutedRef.current = args;
        return;
      }

      // Anything pending is superseded: either the arguments changed (and the
      // timer is rescheduled below) or they did not (and the pending
      // execution would be a duplicate).
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (!delayMs || argsEqual(lastExecutedRef.current, args)) {
        return;
      }

      timerRef.current = setTimeout(() => execute(...args), delayMs);
    },
    [delayMs, execute],
  );

  const flush = useCallback(
    (...args: A) => {
      if (argsEqual(lastExecutedRef.current, args)) {
        return;
      }
      execute(...args);
    },
    [execute],
  );

  return { queue, flush };
}
