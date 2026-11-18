import type { ComponentType, SVGProps } from "react";
import type { UseQueryOptions } from "@tanstack/react-query";

import {
  ISchedule,
  ISchedulePlaylistReference,
  ISchedulePlaylistSyncResult,
  ISongReference,
} from "@/types";
import {
  findAutoReference,
  getSchedulePlaylistProjection,
  SchedulePlaylistProjection,
} from "@/lib/spotify";
import type { ServicesProviderState } from "@/hooks/services.provider";
import type { ISpotifyConnectionStatus } from "@/services/spotify.service";
import { SpotifyIcon } from "@/components/logos/spotify";

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
 * To support another service (YouTube Music, Deezer, ...), add an entry to
 * `SCHEDULE_PLAYLIST_PROVIDERS` and its i18n strings under the entry's prefix
 * in the schedule locale files (e.g. `locales/en/schedules.json`).
 */
export interface SchedulePlaylistProvider {
  /** Value written to the generated reference's `source` field. */
  source: ISchedulePlaylistReference["source"];
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

/** All registered schedule playlist providers. */
export const SCHEDULE_PLAYLIST_PROVIDERS: readonly SchedulePlaylistProvider[] = [
  {
    source: 'spotify-auto',
    Icon: SpotifyIcon,
    i18nPrefix: 'spotify',
    nameKey: 'spotify.serviceName',
    findReference: (references) => findAutoReference(references, 'spotify-auto'),
    getProjection: (schedule) => getSchedulePlaylistProjection(schedule.items),
    statusQuery: ({ spotifyService }) => ({
      ...spotifyService.getStatusQuery(),
      select: (status: ISpotifyConnectionStatus) => ({
        enabled: !!status.playlistsEnabled,
        connected: !!status.connected,
      }),
    }),
    getConnectUrl: async ({ spotifyService }) => (await spotifyService.getConnectUrl()).url,
    sync: ({ schedulesService }, schedule, options) =>
      schedulesService.syncSpotifyPlaylist(schedule.id, schedule.organization!.id, options),
    remove: ({ schedulesService }, schedule) =>
      schedulesService.removeSpotifyPlaylist(schedule.id, schedule.organization!.id),
  },
];
