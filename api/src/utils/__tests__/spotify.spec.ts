import { computeTracksHash, getSpotifyTrackId } from '../spotify';

describe('getSpotifyTrackId', () => {
  it('extracts the track id from a Spotify track URL', () => {
    expect(
      getSpotifyTrackId(
        'https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6',
      ),
    ).toBe('6rqhFgbbKwnb9MLmUQDhG6');
    expect(getSpotifyTrackId('https://open.spotify.com/track/abc?si=xyz')).toBe(
      'abc',
    );
  });

  it('returns null for non-track Spotify URLs', () => {
    expect(
      getSpotifyTrackId(
        'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
      ),
    ).toBeNull();
    expect(
      getSpotifyTrackId(
        'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy',
      ),
    ).toBeNull();
  });

  it('returns null for non-Spotify URLs', () => {
    expect(getSpotifyTrackId('https://www.youtube.com/watch?v=abc')).toBeNull();
    expect(getSpotifyTrackId('not-a-url')).toBeNull();
  });
});

describe('computeTracksHash', () => {
  it('is deterministic and order-sensitive', () => {
    expect(computeTracksHash(['a', 'b'])).toBe(computeTracksHash(['a', 'b']));
    expect(computeTracksHash(['a', 'b'])).not.toBe(
      computeTracksHash(['b', 'a']),
    );
  });

  it('changes when a track is added or removed', () => {
    const before = computeTracksHash(['a', 'b']);
    expect(computeTracksHash(['a'])).not.toBe(before);
    expect(computeTracksHash(['a', 'b', 'c'])).not.toBe(before);
  });

  it('produces a short hex string', () => {
    expect(computeTracksHash(['6rqhFgbbKwnb9MLmUQDhG6'])).toMatch(
      /^[0-9a-f]{8}$/,
    );
  });

  it('handles empty projections', () => {
    expect(computeTracksHash([])).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('computeTracksHash (cross-implementation)', () => {
  it('matches the frontend implementation (app/src/lib/spotify.ts)', () => {
    expect(
      computeTracksHash([
        '6rqhFgbbKwnb9MLmUQDhG6',
        '4uLU6hMCjMI75M1A2tKUQC',
        '7GhIk7Il098yCjg4BQjzvb',
      ]),
    ).toBe('cc6e7023');
  });
});
