/**
 * Shared Spotify helpers for the playlist sync feature. Mirrored in the
 * frontend at `app/src/lib/songs.tsx` — keep both implementations identical.
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
