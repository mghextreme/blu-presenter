import type { ComponentType, SVGProps } from 'react';
import type { UseQueryOptions } from '@tanstack/react-query';

import {
  ISchedule,
  ISchedulePlaylistReference,
  ISchedulePlaylistSyncResult,
  ISongReference,
} from '@/types';
import {
  findAutoReference,
  getSchedulePlaylistProjection,
  SchedulePlaylistProjection,
} from '@/lib/schedule-playlists';
import { getSpotifyTrackId, getYouTubeVideoId } from '@/lib/songs';
import type { ServicesProviderState } from '@/hooks/services.context';
import type { IPlaylistConnectionStatus } from '@/services/playlist-integration.service';
import { SpotifyIcon } from '@/components/logos/spotify';
import { YouTubeIcon } from '@/components/logos/youtube';

/** The current user's access to a provider's playlist feature. */
export interface SchedulePlaylistProviderStatus {
  /** Whether the user may create/sync playlists with this provider (the
   * server is configured and the feature is enabled for the user). */
  enabled: boolean;
  /** Whether the user's account is connected to the provider's service. */
  connected: boolean;
}

/** Options for creating a playlist (ignored when re-syncing an existing one). */
export interface SchedulePlaylistCreateOptions {
  name?: string;
  isPublic?: boolean;
}

/**
 * A streaming service for which BluPresenter can auto-generate a schedule
 * playlist (e.g. a Spotify playlist mirroring the schedule's songs).
 *
 * To support another service (Deezer, Apple Music, ...), add an entry to
 * `SCHEDULE_PLAYLIST_PROVIDERS` and its i18n strings under the entry's prefix
 * in the schedule locale files (e.g. `locales/en/schedules.json`).
 */
export interface SchedulePlaylistProvider {
  /** Value written to the generated reference's `source` field. */
  source: ISchedulePlaylistReference['source'];
  /** Logo shown next to every action for this provider. */
  Icon: ComponentType<Readonly<SVGProps<SVGSVGElement>>>;
  /** i18n key prefix (schedules namespace) holding this provider's strings. */
  i18nPrefix: string;
  /** i18n key of the service's display name, shown in the add menu. */
  nameKey: string;
  /** Finds this provider's auto-generated reference on a schedule, if any. */
  findReference: (references?: ISongReference[]) => ISchedulePlaylistReference | undefined;
  /** Computes the schedule projection used for pending-change detection. */
  getProjection: (schedule: ISchedule) => SchedulePlaylistProjection;
  /** Query resolving the current user's access to this provider. */
  statusQuery: (
    services: ServicesProviderState,
  ) => UseQueryOptions<any, Error, SchedulePlaylistProviderStatus, any>;
  /** Returns the OAuth URL that connects the user's account. */
  getConnectUrl: (services: ServicesProviderState) => Promise<string>;
  /** Creates (or re-syncs) the schedule's playlist from its saved items. */
  sync: (
    services: ServicesProviderState,
    schedule: ISchedule,
    options: SchedulePlaylistCreateOptions,
  ) => Promise<ISchedulePlaylistSyncResult>;
  /** Detaches the generated playlist from the schedule. */
  remove: (services: ServicesProviderState, schedule: ISchedule) => Promise<void>;
}

/** Maps a playlist integration's connection status to the provider status. */
const selectStatus = (status: IPlaylistConnectionStatus): SchedulePlaylistProviderStatus => ({
  enabled: !!status.playlistsEnabled,
  connected: !!status.connected,
});

/** All registered schedule playlist providers. */
export const SCHEDULE_PLAYLIST_PROVIDERS: readonly SchedulePlaylistProvider[] = [
  {
    source: 'spotify-auto',
    Icon: SpotifyIcon,
    i18nPrefix: 'spotify',
    nameKey: 'spotify.serviceName',
    findReference: (references) => findAutoReference(references, 'spotify-auto'),
    getProjection: (schedule) => getSchedulePlaylistProjection(schedule.items, getSpotifyTrackId),
    statusQuery: ({ spotifyService }) => ({
      ...spotifyService.getStatusQuery(),
      select: selectStatus,
    }),
    getConnectUrl: async ({ spotifyService }) => (await spotifyService.getConnectUrl()).url,
    sync: ({ schedulesService }, schedule, options) =>
      schedulesService.syncPlaylist(schedule.id, schedule.organization!.id, 'spotify', options),
    remove: ({ schedulesService }, schedule) =>
      schedulesService.removePlaylist(schedule.id, schedule.organization!.id, 'spotify'),
  },
  {
    source: 'youtube-auto',
    Icon: YouTubeIcon,
    i18nPrefix: 'youtube',
    nameKey: 'youtube.serviceName',
    findReference: (references) => findAutoReference(references, 'youtube-auto'),
    getProjection: (schedule) => getSchedulePlaylistProjection(schedule.items, getYouTubeVideoId),
    statusQuery: ({ youtubeService }) => ({
      ...youtubeService.getStatusQuery(),
      select: selectStatus,
    }),
    getConnectUrl: async ({ youtubeService }) => (await youtubeService.getConnectUrl()).url,
    sync: ({ schedulesService }, schedule, options) =>
      schedulesService.syncPlaylist(schedule.id, schedule.organization!.id, 'youtube', options),
    remove: ({ schedulesService }, schedule) =>
      schedulesService.removePlaylist(schedule.id, schedule.organization!.id, 'youtube'),
  },
];
