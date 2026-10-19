import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useDebouncedCallback } from "../use-debounced-callback";

// Mirrors how QuerySearchForm uses the hook: the initial value is queued on
// mount (and treated as already handled), then every change is queued again.
function setup(callback: (value: string) => void, delayMs?: number) {
  const rendered = renderHook(() =>
    useDebouncedCallback<[string]>(callback, delayMs),
  );

  act(() => {
    // Initial value on mount.
    rendered.result.current.queue("");
  });

  return rendered;
}

describe("useDebouncedCallback", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats the first queued call as already handled", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    setup(callback, 300);
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("fires the callback after the delay with the latest arguments", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = setup(callback, 300);

    act(() => {
      result.current.queue("a");
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("a");
  });

  it("reschedules on rapid calls and only fires the latest arguments", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = setup(callback, 300);

    act(() => {
      result.current.queue("a");
      result.current.queue("ab");
      result.current.queue("abc");
    });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(callback).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("abc");
  });

  it("never fires values equal to the last execution", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = setup(callback, 300);

    act(() => {
      result.current.queue("");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).not.toHaveBeenCalled();

    // Fire a real search, then queue the same arguments again.
    act(() => {
      result.current.queue("ab");
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.queue("ab");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending execution when queueing values equal to the last execution", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = setup(callback, 300);

    // Type and clear back to the initial value before the delay elapses.
    act(() => {
      result.current.queue("a");
    });
    act(() => {
      result.current.queue("");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("flush runs immediately, cancels pending work and is deduplicated", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = setup(callback, 300);

    act(() => {
      result.current.queue("ab");
    });

    act(() => {
      result.current.flush("ab");
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("ab");

    // The pending timer must not fire after the flush.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Flushing the same arguments again is a no-op.
    act(() => {
      result.current.flush("ab");
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("without a delay, queue is a no-op and flush fires immediately", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = setup(callback);

    act(() => {
      result.current.queue("ab");
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      result.current.flush("ab");
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("ab");
  });

  it("does not fire after unmount", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const rendered = setup(callback, 300);

    act(() => {
      rendered.result.current.queue("ab");
    });
    rendered.unmount();
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
