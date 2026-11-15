import { describe, expect, it } from 'vitest';
import {
  computeTracksHash,
  getEmbedInfo,
  getReferenceType,
  getSpotifyPlaylistId,
} from '@/lib/songs';
import {
  findAutoReference,
  findAutoSpotifyReference,
  getSchedulePlaylistProjection,
} from '@/lib/spotify';

describe('getSpotifyPlaylistId', () => {
  it('extracts the playlist id from a Spotify playlist URL', () => {
    expect(getSpotifyPlaylistId('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')).toBe('37i9dQZF1DXcBWIGoYBM5M');
    expect(getSpotifyPlaylistId('https://open.spotify.com/playlist/abc?si=xyz')).toBe('abc');
  });

  it('returns null for non-playlist Spotify URLs', () => {
    expect(getSpotifyPlaylistId('https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6')).toBeNull();
    expect(getSpotifyPlaylistId('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy')).toBeNull();
  });

  it('returns null for non-Spotify URLs', () => {
    expect(getSpotifyPlaylistId('https://www.youtube.com/watch?v=abc')).toBeNull();
    expect(getSpotifyPlaylistId('not-a-url')).toBeNull();
  });
});

describe('reference type and embed for playlists', () => {
  it('recognizes playlist URLs as spotify-playlist references', () => {
    expect(getReferenceType('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')).toBe('spotify-playlist');
  });

  it('builds an embed info for playlist URLs', () => {
    expect(getEmbedInfo('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=x')).toEqual({
      type: 'spotify-playlist',
      playlistId: '37i9dQZF1DXcBWIGoYBM5M',
    });
  });
});

describe('computeTracksHash', () => {
  it('is deterministic and order-sensitive', () => {
    expect(computeTracksHash(['a', 'b'])).toBe(computeTracksHash(['a', 'b']));
    expect(computeTracksHash(['a', 'b'])).not.toBe(computeTracksHash(['b', 'a']));
  });

  it('changes when a track is added or removed', () => {
    const before = computeTracksHash(['a', 'b']);
    expect(computeTracksHash(['a'])).not.toBe(before);
    expect(computeTracksHash(['a', 'b', 'c'])).not.toBe(before);
  });

  it('produces a short hex string', () => {
    expect(computeTracksHash([])).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('getSchedulePlaylistProjection', () => {
  it('collects ordered track ids from song items and reports skips', () => {
    const items = [
      { type: 'song', id: 1, title: 'Song A', references: [{ url: 'https://open.spotify.com/track/abc' }] },
      { type: 'text', title: 'Announcements' },
      { type: 'song', id: 2, title: 'Song B', references: [{ url: 'https://youtube.com/watch?v=x' }] },
      { type: 'song', id: 3, title: 'Song C', references: [{ url: 'https://open.spotify.com/track/def?si=y' }] },
    ];

    const projection = getSchedulePlaylistProjection(items as any);

    expect(projection.trackIds).toEqual(['abc', 'def']);
    expect(projection.skipped).toEqual([{ songId: 2, title: 'Song B' }]);
    expect(projection.hash).toBe(computeTracksHash(['abc', 'def']));
  });

  it('returns an empty projection for schedules without songs', () => {
    const projection = getSchedulePlaylistProjection([]);
    expect(projection.trackIds).toEqual([]);
    expect(projection.skipped).toEqual([]);
  });
});

describe('findAutoReference', () => {
  it('finds the auto-generated reference of the given source', () => {
    const references = [
      { url: 'https://example.com' },
      { url: 'https://open.spotify.com/playlist/pl1', source: 'spotify-auto' as const },
      { url: 'https://youtube.com/playlist?list=pl2', source: 'youtube-auto' as const },
    ];
    expect(findAutoReference(references, 'spotify-auto')?.url).toBe('https://open.spotify.com/playlist/pl1');
    expect(findAutoReference(references, 'youtube-auto')?.url).toBe('https://youtube.com/playlist?list=pl2');
  });

  it('returns undefined when there is none', () => {
    expect(findAutoReference([{ url: 'https://open.spotify.com/track/abc' }], 'spotify-auto')).toBeUndefined();
    expect(findAutoReference(undefined, 'spotify-auto')).toBeUndefined();
  });
});

describe('findAutoSpotifyReference', () => {
  it('finds the auto-generated reference', () => {
    const references = [
      { url: 'https://example.com' },
      { url: 'https://open.spotify.com/playlist/pl1', source: 'spotify-auto' as const },
    ];
    expect(findAutoSpotifyReference(references)?.url).toBe('https://open.spotify.com/playlist/pl1');
  });

  it('returns undefined when there is none', () => {
    expect(findAutoSpotifyReference([{ url: 'https://open.spotify.com/track/abc' }])).toBeUndefined();
    expect(findAutoSpotifyReference(undefined)).toBeUndefined();
  });
});
