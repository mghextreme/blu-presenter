import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ISchedule, describeApiError } from '@/types';
import { useServices } from '@/hooks/useServices';
import { SchedulePlaylistCreateOptions, SchedulePlaylistProvider } from './playlist-providers';

interface PlaylistSyncVariables {
  provider: SchedulePlaylistProvider;
  options: SchedulePlaylistCreateOptions;
}

/**
 * Creates or re-syncs a provider's schedule playlist and hands the refreshed
 * schedule to `onSynced` afterwards. Provider behaviour lives on the provider
 * entries (`playlist-providers.tsx`).
 */
export function usePlaylistSync(schedule: ISchedule, onSynced?: (schedule: ISchedule) => void) {
  const { t } = useTranslation('schedules');
  const services = useServices();
  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: (provider: SchedulePlaylistProvider) => provider.getConnectUrl(services),
    onSuccess: (url) => {
      setTimeout(() => {
        window.open(url, '_self');
      }, 300);
    },
    onError: async (e, provider) => {
      toast.error(t(`${provider.i18nPrefix}.connectFailed`), {
        description: await describeApiError(e),
      });
    },
  });

  const reloadSchedule = async () => {
    const fresh = await services.schedulesService.fetchById(schedule.id);
    if (fresh) {
      onSynced?.(fresh);
    }
  };

  const syncMutation = useMutation({
    mutationFn: ({ provider, options }: PlaylistSyncVariables) =>
      provider.sync(services, schedule, options),
    onSuccess: async (result, { provider }) => {
      const prefix = provider.i18nPrefix;
      if (result.skipped.length > 0) {
        toast.success(t(`${prefix}.syncedWithSkipped`, { added: result.added }), {
          description: t(`${prefix}.syncedSkippedDescription`, {
            skipped: result.skipped.map((song) => song.title).join(', '),
          }),
        });
      } else {
        toast.success(t(`${prefix}.synced`, { added: result.added }));
      }

      await reloadSchedule();
    },
    onError: async (e, { provider }) => {
      toast.error(t(`${provider.i18nPrefix}.syncFailed`), {
        description: await describeApiError(e),
      });
      // A failed creation may still have attached the (pending) playlist:
      // show it, so retrying re-syncs it instead of offering a new one. The
      // API also drops a revoked connection, so refetch its status to show
      // the reconnect prompt.
      await Promise.all([
        reloadSchedule().catch(() => undefined),
        queryClient.invalidateQueries({
          queryKey: provider.statusQuery(services).queryKey,
        }),
      ]);
    },
  });

  /** Returns whether the sync succeeded. */
  const sync = (
    provider: SchedulePlaylistProvider,
    options: SchedulePlaylistCreateOptions = {},
  ): Promise<boolean> =>
    syncMutation.mutateAsync({ provider, options }).then(
      () => true,
      () => false,
    );

  // After a successful connect the browser is leaving for the provider's page.
  const isRedirecting = connectMutation.isSuccess;
  const isBusy = connectMutation.isPending || isRedirecting || syncMutation.isPending;

  return { isBusy, connect: connectMutation.mutate, sync };
}
