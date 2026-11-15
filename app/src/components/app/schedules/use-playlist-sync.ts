import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ISchedule, describeApiError } from "@/types";
import { useServices } from "@/hooks/useServices";
import { SchedulePlaylistProvider } from "./playlist-providers";

/**
 * Creates or re-syncs a provider's schedule playlist and refreshes the
 * schedule afterwards. Returns whether the sync succeeded.
 *
 * Providers are registered in `playlist-providers.tsx`; each new service also
 * needs a `case` in the `switch` blocks below (connect URL and sync call) and
 * in `useProviderConnection` (schedule-references.tsx).
 */
export function usePlaylistSync(schedule: ISchedule, onSynced: (schedule: ISchedule) => void) {
  const { t } = useTranslation("schedules");
  const { schedulesService, spotifyService } = useServices();
  const [isBusy, setBusy] = useState(false);

  /** Returns the OAuth connect URL of a provider. One case per provider. */
  const getProviderConnectUrl = (provider: SchedulePlaylistProvider): Promise<string> => {
    switch (provider.source) {
      case 'spotify-auto':
        return spotifyService.getConnectUrl().then(({ url }) => url);
      default:
        throw new Error(`No connect flow for schedule playlist provider: ${provider.source}`);
    }
  };

  /** Calls the provider's create/re-sync endpoint. One case per provider. */
  const syncProviderPlaylist = (
    provider: SchedulePlaylistProvider,
    name?: string,
  ): Promise<{ action: 'created' | 'synced'; url: string; added: number; skipped: { songId: number; title: string }[] }> => {
    switch (provider.source) {
      case 'spotify-auto':
        return schedulesService.syncSpotifyPlaylist(
          schedule.id,
          schedule.organization!.id,
          name,
        );
      default:
        throw new Error(`No sync flow for schedule playlist provider: ${provider.source}`);
    }
  };

  const connect = async (provider: SchedulePlaylistProvider) => {
    setBusy(true);
    try {
      const url = await getProviderConnectUrl(provider);
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

  const sync = async (
    provider: SchedulePlaylistProvider,
    name?: string,
  ): Promise<boolean> => {
    const prefix = provider.i18nPrefix;

    setBusy(true);
    try {
      const result = await syncProviderPlaylist(provider, name);

      if (result.skipped.length > 0) {
        toast.success(t(`${prefix}.syncedWithSkipped`, { added: result.added }), {
          description: t(`${prefix}.syncedSkippedDescription`, {
            skipped: result.skipped.map((song) => song.title).join(', '),
          }),
        });
      } else {
        toast.success(t(`${prefix}.synced`, { added: result.added }));
      }

      // The schedule changed server-side: drop every cached variant of it
      // (loaders key the cache with or without the schedule secret), then
      // refetch the canonical entry used by the app routes.
      schedulesService.clearCache();
      const fresh = await schedulesService.fetchById(schedule.id);
      if (fresh) {
        onSynced(fresh);
      }

      return true;
    } catch (e: any) {
      toast.error(t(`${prefix}.syncFailed`), {
        description: await describeApiError(e),
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { isBusy, connect, sync };
}
