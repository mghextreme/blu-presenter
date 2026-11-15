import type { ComponentType, SVGProps } from "react";

import { ISchedule, ISchedulePlaylistReference, ISongReference } from "@/types";
import {
  findAutoReference,
  getSchedulePlaylistProjection,
  SchedulePlaylistProjection,
} from "@/lib/spotify";
import { SpotifyIcon } from "@/components/logos/spotify";

/**
 * A streaming service for which BluPresenter can auto-generate a schedule
 * playlist (e.g. a Spotify playlist mirroring the schedule's songs).
 *
 * To support another service (YouTube Music, Deezer, ...):
 * 1. add an entry to `SCHEDULE_PLAYLIST_PROVIDERS`,
 * 2. add its behaviour to the `switch` blocks in `use-playlist-sync.ts`
 *    (connect URL and sync call) and in `useProviderConnection`
 *    (schedule-references.tsx),
 * 3. add its i18n strings under the entry's prefix in the schedule locale
 *    files (e.g. `locales/en/schedules.json`).
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
  },
];
