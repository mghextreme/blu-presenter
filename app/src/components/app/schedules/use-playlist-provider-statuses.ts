import { useQueries } from '@tanstack/react-query';

import { useServices } from '@/hooks/useServices';
import {
  SCHEDULE_PLAYLIST_PROVIDERS,
  SchedulePlaylistProvider,
  SchedulePlaylistProviderStatus,
} from './playlist-providers';

export type SchedulePlaylistProviderStatuses = Partial<
  Record<SchedulePlaylistProvider['source'], SchedulePlaylistProviderStatus>
>;

/**
 * The current user's status for every playlist provider, keyed by source. A
 * provider is missing while its status loads (or when it failed to load).
 */
export function usePlaylistProviderStatuses(enabled: boolean): SchedulePlaylistProviderStatuses {
  const services = useServices();
  return useQueries({
    queries: SCHEDULE_PLAYLIST_PROVIDERS.map((provider) => ({
      ...provider.statusQuery(services),
      enabled,
      retry: false,
    })),
    combine: (results) =>
      Object.fromEntries(
        SCHEDULE_PLAYLIST_PROVIDERS.map((provider, ix) => [provider.source, results[ix].data]),
      ) as SchedulePlaylistProviderStatuses,
  });
}
