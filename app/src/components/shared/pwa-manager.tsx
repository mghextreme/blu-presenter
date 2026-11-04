import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRegisterSW } from "virtual:pwa-register/react";

import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const DISMISS_KEY = "pwa-update-dismissed";

/**
 * Registers the service worker and, ONLY inside the installed app (standalone
 * mode), shows an unobtrusive banner when a new version is waiting. In a
 * regular browser tab no banner is shown: the waiting service worker simply
 * activates when all tabs are closed, so the next launch picks up the update.
 *
 * Updates are prompt-based (`registerType: 'prompt'` in vite.config.ts): the
 * new service worker waits until the user accepts the reload, so an active
 * presentation is never interrupted mid-service. Dismissing hides the banner
 * for the rest of the browser session.
 *
 * Rendered once from main.tsx. It intentionally does NOT use the sonner
 * Toaster — each layout mounts its own <Toaster />, so a global toast would
 * render duplicated.
 */
export function PwaManager() {
  const { t } = useTranslation("pwa");
  const { isStandalone } = usePwaInstall();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === "1",
  );

  const { needRefresh, updateServiceWorker } = useRegisterSW();

  if (!needRefresh || !isStandalone || dismissed) return null;

  const handleReload = () => {
    // workbox-window asks the waiting worker to skip waiting and reloads the
    // window when it takes control. Belt-and-braces: force a reload if that
    // event never arrives (e.g. the waiting worker was already activated when
    // the page was loaded, so there is nobody left to message) — this way the
    // action always makes progress instead of silently doing nothing.
    setTimeout(() => window.location.reload(), 1500);
    void updateServiceWorker();
  };

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-4 rounded-lg border bg-background p-4 shadow-lg"
    >
      <div className="max-w-xs text-sm">
        <p className="font-medium">{t('update.title')}</p>
        <p className="text-muted-foreground">{t('update.description')}</p>
      </div>
      <div className="flex flex-col items-stretch gap-2">
        <Button size="sm" onClick={handleReload}>
          {t('update.action')}
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          {t('update.dismiss')}
        </Button>
      </div>
    </div>
  );
}
