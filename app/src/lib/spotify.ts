import { IScheduleItem, ISongReference } from "@/types";
import { ISchedulePlaylistReference } from "@/types/schedule-playlist-reference.interface";
import { getSpotifyTrackId } from "@/lib/songs";

/**
 * Spotify playlist sync helpers. Mirrors the API implementation at
 * `api/src/utils/spotify.ts` — keep both implementations identical.
 */

/** The `source` values identifying auto-generated playlist references. */
export type SchedulePlaylistSource = ISchedulePlaylistReference['source'];

/**
 * Finds the auto-generated playlist reference of the given source, if any.
 */
export function findAutoReference(
  references: ISongReference[] | undefined,
  source: SchedulePlaylistSource,
): ISchedulePlaylistReference | undefined {
  return references?.find(
    (reference): reference is ISchedulePlaylistReference =>
      'source' in reference && reference.source === source,
  );
}

/**
 * Deterministic short hash over the ordered track projection of a schedule.
 * Used to detect whether the schedule changed since the last playlist sync.
 */
export function computeTracksHash(trackIds: string[]): string {
  const input = trackIds.join('|');
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    // `| 0` wraps to int32 exactly like the API implementation.
    hash = Math.trunc((hash << 5) + hash + input.charCodeAt(i));
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export interface SchedulePlaylistProjection {
  /** Ordered Spotify track ids of all songs that have one. */
  trackIds: string[];
  /** Songs without any Spotify track reference. */
  skipped: { songId: number; title: string }[];
  /** Hash over the ordered track ids (see computeTracksHash). */
  hash: string;
}

/**
 * Computes the ordered Spotify track projection of a schedule's song items —
 * the same list the "create/re-sync playlist" action writes to Spotify.
 */
export function getSchedulePlaylistProjection(
  items?: IScheduleItem[],
): SchedulePlaylistProjection {
  const trackIds: string[] = [];
  const skipped: { songId: number; title: string }[] = [];

  for (const item of items ?? []) {
    if (item.type !== 'song') continue;

    const songItem = item as { id: number; title?: string; references?: ISongReference[] };
    const trackId = (songItem.references ?? [])
      .map((reference) => getSpotifyTrackId(reference.url))
      .find((id) => id !== null);

    if (trackId) {
      trackIds.push(trackId);
    } else {
      skipped.push({ songId: songItem.id, title: songItem.title ?? '' });
    }
  }

  return { trackIds, skipped, hash: computeTracksHash(trackIds) };
}
