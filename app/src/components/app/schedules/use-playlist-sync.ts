import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ISchedule, describeApiError } from "@/types";
import { useServices } from "@/hooks/useServices";
import { SchedulePlaylistCreateOptions, SchedulePlaylistProvider } from "./playlist-providers";

/**
 * Creates or re-syncs a provider's schedule playlist and refreshes the
 * schedule afterwards. Provider behaviour lives on the provider entries
 * (`playlist-providers.tsx`).
 */
export function usePlaylistSync(schedule: ISchedule, onSynced: (schedule: ISchedule) => void) {
  const { t } = useTranslation("schedules");
  const services = useServices();
  const queryClient = useQueryClient();
  const [isBusy, setBusy] = useState(false);

  const connect = async (provider: SchedulePlaylistProvider) => {
    setBusy(true);
    try {
      const url = await provider.getConnectUrl(services);
      setTimeout(() => {
        window.open(url, '_self');
      }, 300);
    } catch (e: any) {
      toast.error(t(`${provider.i18nPrefix}.connectFailed`), {
        description: await describeApiError(e),
      });
      setBusy(false);
    }
  };

  /**
   * Refetches the schedule after a server-side change: drops every cached
   * variant of it (loaders key the cache with or without the schedule
   * secret), then refetches the canonical entry used by the app routes.
   */
  const refresh = async () => {
    void services.schedulesService.invalidateCache();
    const fresh = await services.schedulesService.fetchById(schedule.id);
    if (fresh) {
      onSynced(fresh);
    }
  };

  /** Returns whether the sync succeeded. */
  const sync = async (
    provider: SchedulePlaylistProvider,
    options: SchedulePlaylistCreateOptions = {},
  ): Promise<boolean> => {
    const prefix = provider.i18nPrefix;

    setBusy(true);
    try {
      const result = await provider.sync(services, schedule, options);

      if (result.skipped.length > 0) {
        toast.success(t(`${prefix}.syncedWithSkipped`, { added: result.added }), {
          description: t(`${prefix}.syncedSkippedDescription`, {
            skipped: result.skipped.map((song) => song.title).join(', '),
          }),
        });
      } else {
        toast.success(t(`${prefix}.synced`, { added: result.added }));
      }

      await refresh();
      return true;
    } catch (e: any) {
      toast.error(t(`${prefix}.syncFailed`), {
        description: await describeApiError(e),
      });
      // A failed creation may still have attached the (pending) playlist:
      // show it, so retrying re-syncs it instead of offering a new one. The
      // API also drops a revoked connection, so refetch its status to show
      // the reconnect prompt.
      await Promise.all([
        refresh().catch(() => undefined),
        queryClient.invalidateQueries({
          queryKey: provider.statusQuery(services).queryKey,
        }),
      ]);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { isBusy, connect, sync };
}
