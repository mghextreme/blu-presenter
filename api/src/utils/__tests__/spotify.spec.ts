import { getSpotifyTrackId } from '../spotify';

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
