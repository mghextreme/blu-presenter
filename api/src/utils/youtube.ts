/**
 * Shared YouTube helpers for the playlist sync feature. Mirrored in the
 * frontend at `app/src/lib/songs.tsx` — keep both implementations identical.
 */

/**
 * Extracts a YouTube video id from a URL (youtube.com, music.youtube.com or
 * youtu.be), or null when the URL is not a YouTube video link.
 */
export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');

    if (hostname === 'youtube.com' || hostname === 'music.youtube.com') {
      return parsed.searchParams.get('v');
    }

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      return id.length > 0 ? id : null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extracts a YouTube playlist id from a playlist URL, or null when the URL is
 * not a YouTube playlist link.
 */
export function getYouTubePlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');
    if (
      hostname !== 'youtube.com' &&
      hostname !== 'music.youtube.com' &&
      hostname !== 'm.youtube.com'
    ) {
      return null;
    }
    const list = parsed.searchParams.get('list');
    return list && /^[\w-]+$/.test(list) ? list : null;
  } catch {
    return null;
  }
}
