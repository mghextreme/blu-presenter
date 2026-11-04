import { useCallback, useEffect, useState } from "react";

/**
 * Tracks PWA installation state and exposes the native install prompt.
 *
 * The `beforeinstallprompt` event fires once per page load, possibly before
 * React mounts, so the capture listener is registered at module scope and the
 * event is shared through a module-level singleton. `canInstall` is only true
 * when the browser can actually show the install prompt AND the app is not
 * already running as an installed (standalone) PWA — callers should hide
 * install buttons/labels whenever `canInstall` is false.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const availabilityListeners = new Set<(available: boolean) => void>();

function setDeferredPrompt(event: BeforeInstallPromptEvent | null) {
  deferredPrompt = event;
  availabilityListeners.forEach((listener) => listener(event !== null));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Prevent both the native mini-infobar and a second prompt from our UI.
    event.preventDefault();
    setDeferredPrompt(event as BeforeInstallPromptEvent);
  });
  window.addEventListener("appinstalled", () => setDeferredPrompt(null));
}

export function isStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari sets a proprietary flag when running as a home-screen app.
    Boolean((window.navigator as { standalone?: boolean }).standalone)
  );
}

export type InstallPromptOutcome = "accepted" | "dismissed" | "unavailable";

export function usePwaInstall() {
  const [canPrompt, setCanPrompt] = useState(() => deferredPrompt !== null);
  const [isStandalone, setIsStandalone] = useState(isStandaloneMode);

  useEffect(() => {
    const onAvailability = (available: boolean) => setCanPrompt(available);
    availabilityListeners.add(onAvailability);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => setIsStandalone(isStandaloneMode());
    mediaQuery.addEventListener("change", onDisplayModeChange);

    return () => {
      availabilityListeners.delete(onAvailability);
      mediaQuery.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallPromptOutcome> => {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // The prompt is one-shot per page load: after prompting (either outcome)
    // the browser will not fire `beforeinstallprompt` again until a reload.
    setDeferredPrompt(null);
    return outcome;
  }, []);

  // In standalone mode the app is already installed: there is nothing to
  // install, so suppress install affordances.
  const canInstall = canPrompt && !isStandalone;

  return { canInstall, isStandalone, promptInstall };
}
