import { getYouTubePlaylistId, getYouTubeVideoId } from '../youtube';

describe('getYouTubeVideoId', () => {
  it('extracts the id from youtube.com watch URLs', () => {
    expect(
      getYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
    expect(
      getYouTubeVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('extracts the id from YouTube Music URLs', () => {
    expect(
      getYouTubeVideoId('https://music.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('extracts the id from youtu.be short links', () => {
    expect(getYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?si=abc')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('keeps the video of a watch URL inside a playlist', () => {
    expect(
      getYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1'),
    ).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-video URLs', () => {
    expect(
      getYouTubeVideoId('https://www.youtube.com/playlist?list=PL1'),
    ).toBeNull();
    expect(getYouTubeVideoId('https://youtu.be/')).toBeNull();
    expect(getYouTubeVideoId('https://open.spotify.com/track/abc')).toBeNull();
    expect(getYouTubeVideoId('not-a-url')).toBeNull();
  });
});

describe('getYouTubePlaylistId', () => {
  it('extracts the list id from playlist URLs', () => {
    expect(
      getYouTubePlaylistId('https://www.youtube.com/playlist?list=PLabc_-1'),
    ).toBe('PLabc_-1');
    expect(
      getYouTubePlaylistId('https://music.youtube.com/playlist?list=PLabc'),
    ).toBe('PLabc');
  });

  it('returns null for other URLs', () => {
    expect(
      getYouTubePlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toBeNull();
    expect(
      getYouTubePlaylistId('https://evil.example/playlist?list=PLabc'),
    ).toBeNull();
    expect(
      getYouTubePlaylistId('https://www.youtube.com/playlist?list=a/b'),
    ).toBeNull();
    expect(getYouTubePlaylistId('not-a-url')).toBeNull();
  });
});
