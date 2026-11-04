import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { usePwaInstall } from "../use-pwa-install";

/**
 * The `beforeinstallprompt` capture listener is registered at module scope, so
 * the deferred prompt is a module-level singleton shared by every hook
 * instance. Tests below therefore fire events sequentially and rely on the
 * documented one-shot behavior of the prompt.
 */
function fireBeforeInstallPrompt(outcome: "accepted" | "dismissed" = "accepted") {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = new Event("beforeinstallprompt");
  Object.assign(event, {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return { prompt };
}

function setStandalone(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(() => {
  // Restore the global setup.ts matchMedia stub (non-standalone).
  setStandalone(false);
});

describe("usePwaInstall", () => {
  it("becomes installable when the browser fires beforeinstallprompt", () => {
    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.canInstall).toBe(false);
    expect(result.current.isStandalone).toBe(false);

    fireBeforeInstallPrompt();

    expect(result.current.canInstall).toBe(true);
  });

  it("prompts the browser, resolves the user outcome, and clears availability (prompt is one-shot)", async () => {
    const { result } = renderHook(() => usePwaInstall());
    const { prompt } = fireBeforeInstallPrompt();
    expect(result.current.canInstall).toBe(true);

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(outcome).toBe("accepted");
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(result.current.canInstall).toBe(false);
  });

  it("resolves 'dismissed' when the user cancels the native dialog", async () => {
    const { result } = renderHook(() => usePwaInstall());
    fireBeforeInstallPrompt("dismissed");

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(outcome).toBe("dismissed");
    expect(result.current.canInstall).toBe(false);
  });

  it("returns 'unavailable' when prompting without a captured event", async () => {
    const { result } = renderHook(() => usePwaInstall());

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(outcome).toBe("unavailable");
  });

  it("suppresses install affordances when running as a standalone installed app", () => {
    setStandalone(true);
    const { result } = renderHook(() => usePwaInstall());

    expect(result.current.isStandalone).toBe(true);

    fireBeforeInstallPrompt();

    // Even with a captured prompt event, canInstall stays false so callers
    // hide install buttons inside the installed app.
    expect(result.current.canInstall).toBe(false);
  });
});
