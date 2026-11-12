/**
 * Shared Spotify helpers for the playlist sync feature. Mirrored in the
 * frontend at `app/src/lib/spotify.ts` — keep both implementations identical.
 */

/**
 * Extracts a Spotify track id from a URL, or null when the URL is not a
 * Spotify track link.
 */
export function getSpotifyTrackId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    if (hostname !== 'spotify.com' && !hostname.endsWith('.spotify.com')) {
      return null;
    }
    const match = /\/track\/([a-zA-Z0-9]+)/.exec(parsed.pathname);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Deterministic short hash over the ordered track projection of a schedule.
 * Used to detect whether the schedule changed since the last playlist sync.
 */
export function computeTracksHash(trackIds: string[]): string {
  const input = trackIds.join('|');
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
