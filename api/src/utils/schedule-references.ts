import type { SchedulePlaylistReference, SongReference } from 'src/entities';

type ScheduleReference = SongReference | SchedulePlaylistReference;

/** Sources of the references the app generates and manages server-side. */
export const SCHEDULE_AUTO_REFERENCE_SOURCES = [
  'spotify-auto',
  'youtube-auto',
] as const;

/**
 * True for an app-generated reference (e.g. a schedule's Spotify playlist).
 * Defensive against malformed JSON rows: non-objects are never auto refs.
 */
export function isAutoReference(
  reference: unknown,
): reference is SchedulePlaylistReference {
  return (
    !!reference &&
    typeof reference === 'object' &&
    typeof (reference as { source?: unknown }).source === 'string'
  );
}

/** Drops malformed entries (non-objects or without a string url). */
function isWellFormed(reference: unknown): reference is ScheduleReference {
  return (
    !!reference &&
    typeof reference === 'object' &&
    typeof (reference as { url?: unknown }).url === 'string'
  );
}

/**
 * Merges the references a client sent with the stored ones.
 *
 * Auto-generated references are managed by the server only: their metadata
 * (url, owner, sync state) can never be set or changed by a client. An
 * incoming auto reference only marks the position of the stored one with the
 * same source (unknown sources are dropped), and stored auto references the
 * client omitted are kept — they are removed through their own endpoint, so a
 * stale editor can't silently drop a playlist created in the meantime.
 */
export function mergeScheduleReferences(
  incoming: { url: string; name?: string; source?: string }[],
  stored: unknown[] | null | undefined,
): ScheduleReference[] {
  const storedAuto = (stored ?? []).filter(isAutoReference);
  const usedSources = new Set<string>();
  const result: ScheduleReference[] = [];

  for (const reference of incoming) {
    if (reference.source) {
      const match = storedAuto.find(
        (candidate) => candidate.source === reference.source,
      );
      if (match && !usedSources.has(match.source)) {
        usedSources.add(match.source);
        result.push(stripPresentationFields(match));
      }
      continue;
    }

    result.push({
      url: reference.url,
      ...(reference.name ? { name: reference.name } : {}),
    });
  }

  for (const reference of storedAuto) {
    if (!usedSources.has(reference.source)) {
      result.push(stripPresentationFields(reference));
    }
  }

  return result;
}

/**
 * Prepares stored references for an API response: drops malformed entries,
 * replaces the internal owner id of auto references with `syncedByMe`, and
 * hides the owner's name from anonymous (shared-link) viewers.
 */
export function presentScheduleReferences(
  references: unknown[] | null | undefined,
  userId: number | undefined,
): ScheduleReference[] {
  return (references ?? []).filter(isWellFormed).map((reference) => {
    if (!isAutoReference(reference)) {
      return reference;
    }

    const { syncedBy, syncedByName, ...rest } =
      stripPresentationFields(reference);
    return {
      ...rest,
      ...(userId !== undefined && syncedByName ? { syncedByName } : {}),
      syncedByMe: userId !== undefined && syncedBy === userId,
    };
  });
}

/**
 * Deterministic short hash over the ordered track projection of a schedule
 * (Spotify track ids, YouTube video ids, ...). Used to detect whether the
 * schedule changed since the last playlist sync. Mirrored in the frontend at
 * `app/src/lib/schedule-playlists.ts` — keep both implementations identical.
 */
export function computeTracksHash(trackIds: string[]): string {
  const input = trackIds.join('|');
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Removes fields computed per response, which must never be persisted. */
function stripPresentationFields(
  reference: SchedulePlaylistReference,
): SchedulePlaylistReference {
  const { syncedByMe: _syncedByMe, ...rest } = reference;
  return rest;
}
