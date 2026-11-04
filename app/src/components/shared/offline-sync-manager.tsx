import { useEffect } from "react";

import { useServices } from "@/hooks/useServices";

/**
 * Mounts once inside the authenticated app layout: requests persistent
 * storage (so the browser won't evict downloaded content under disk pressure)
 * and revalidates downloaded content in the background when the app opens or
 * the connection comes back. Revalidation is throttled internally.
 */
export function OfflineSyncManager() {
  const { offlineDownloadsService } = useServices();

  useEffect(() => {
    // Best-effort: Firefox/Chrome prompt or resolve silently; Safari ignores.
    navigator.storage?.persist?.().catch(() => { /* non-critical */ });

    const revalidate = () => {
      offlineDownloadsService.revalidateAll().catch(() => { /* non-critical */ });
    };
    revalidate();

    window.addEventListener("online", revalidate);
    return () => window.removeEventListener("online", revalidate);
  }, [offlineDownloadsService]);

  return null;
}
