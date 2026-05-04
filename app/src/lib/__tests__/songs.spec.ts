import { describe, it, expect } from 'vitest'
import {
  parseSongText,
  capitalizeText,
  transposeNote,
  transposeChordToken,
  transposeLine,
  swapAccidentals,
  getSpotifyTrackId,
  getYouTubeVideoId,
  getDeezerTrackId,
  getDeezerShareUrl,
  getSoundCloudUrl,
  getAppleMusicEmbedUrl,
  getTidalTrackId,
  getReferenceType,
} from '../songs'

describe('capitalizeText', () => {
  it('lowercases an all-uppercase single line and capitalizes the first letter', () => {
    expect(capitalizeText('HELLO WORLD')).toBe('Hello world');
  });

  it('capitalizes the first letter of a lowercase string', () => {
    expect(capitalizeText('hello world')).toBe('Hello world');
  });

  it('capitalizes after sentence-ending punctuation', () => {
    expect(capitalizeText('HELLO WORLD. HOW ARE YOU?')).toBe('Hello world. How are you?');
  });

  it('capitalizes after exclamation marks', () => {
    expect(capitalizeText('PRAISE HIM! GLORY TO GOD')).toBe('Praise him! Glory to god');
  });

  it('does not trim trailing whitespace (trimming is the caller\'s responsibility)', () => {
    expect(capitalizeText('HELLO   ')).toBe('Hello   ');
  });

  it('handles a single word', () => {
    expect(capitalizeText('ALELUIA')).toBe('Aleluia');
  });

  it('handles accented characters at the start', () => {
    expect(capitalizeText('ÔMEGA')).toBe('Ômega');
  });

  it('preserves an already correctly cased string', () => {
    expect(capitalizeText('Hello world')).toBe('Hello world');
  });
});

describe('parseSongText', () => {
  it('should parse a song with title, artist, and lyrics-only blocks', () => {
    const input = `Quebrantado
Vineyard

Eu olho para a cruz
Para a cruz eu vou
Do seu sofrer, participar
Sua obra, vou cantar

Meu salvador
Na cruz, mostrou
O amor do pai
O justo Deus`;

    const result = parseSongText(input);

    expect(result.title).toBe('Quebrantado');
    expect(result.artist).toBe('Vineyard');
    expect(result.blocks).toHaveLength(2);

    expect(result.blocks[0].lines).toEqual([
      { type: 'lyrics', content: 'Eu olho para a cruz' },
      { type: 'lyrics', content: 'Para a cruz eu vou' },
      { type: 'lyrics', content: 'Do seu sofrer, participar' },
      { type: 'lyrics', content: 'Sua obra, vou cantar' },
    ]);

    expect(result.blocks[1].lines).toEqual([
      { type: 'lyrics', content: 'Meu salvador' },
      { type: 'lyrics', content: 'Na cruz, mostrou' },
      { type: 'lyrics', content: 'O amor do pai' },
      { type: 'lyrics', content: 'O justo Deus' },
    ]);
  });

  it('should parse lyrics-only blocks without title or artist', () => {
    const input = `Eu olho para a cruz
Para a cruz eu vou
Do seu sofrer, participar
Sua obra, vou cantar

Meu salvador
Na cruz, mostrou
O amor do pai
O justo Deus`;

    const result = parseSongText(input);

    expect(result.title).toBe('');
    expect(result.artist).toBe('');
    expect(result.blocks).toHaveLength(2);

    expect(result.blocks[0].lines).toEqual([
      { type: 'lyrics', content: 'Eu olho para a cruz' },
      { type: 'lyrics', content: 'Para a cruz eu vou' },
      { type: 'lyrics', content: 'Do seu sofrer, participar' },
      { type: 'lyrics', content: 'Sua obra, vou cantar' },
    ]);

    expect(result.blocks[1].lines).toEqual([
      { type: 'lyrics', content: 'Meu salvador' },
      { type: 'lyrics', content: 'Na cruz, mostrou' },
      { type: 'lyrics', content: 'O amor do pai' },
      { type: 'lyrics', content: 'O justo Deus' },
    ]);
  });

  it('should parse blocks with chords and lyrics without title or artist', () => {
    const input = `F#            A#m
Nada nos separará
 F#                      A#m
Dos laços do Teu grande amor
 F#
De longe ouvimos o amor que chama
   A#m
Paixão profunda, bondade e graça
    G#
Se derramando

F#
É tão profundo tão imenso, e cobre-nos
 C#
Furioso, Poderoso, Abraça-nos
 F#
Só Ele pode devolver
                C#
A vida aos corações`;

    const result = parseSongText(input);

    expect(result.title).toBe('');
    expect(result.artist).toBe('');
    expect(result.blocks).toHaveLength(2);

    // First block: alternating chords and lyrics
    expect(result.blocks[0].lines).toHaveLength(10);
    expect(result.blocks[0].lines[0]).toEqual({ type: 'chords', content: 'F#            A#m' });
    expect(result.blocks[0].lines[1]).toEqual({ type: 'lyrics', content: 'Nada nos separará' });
    expect(result.blocks[0].lines[2]).toEqual({ type: 'chords', content: ' F#                      A#m' });
    expect(result.blocks[0].lines[3]).toEqual({ type: 'lyrics', content: 'Dos laços do Teu grande amor' });
    expect(result.blocks[0].lines[4]).toEqual({ type: 'chords', content: ' F#' });
    expect(result.blocks[0].lines[5]).toEqual({ type: 'lyrics', content: 'De longe ouvimos o amor que chama' });
    expect(result.blocks[0].lines[6]).toEqual({ type: 'chords', content: '   A#m' });
    expect(result.blocks[0].lines[7]).toEqual({ type: 'lyrics', content: 'Paixão profunda, bondade e graça' });
    expect(result.blocks[0].lines[8]).toEqual({ type: 'chords', content: '    G#' });
    expect(result.blocks[0].lines[9]).toEqual({ type: 'lyrics', content: 'Se derramando' });

    // Second block
    expect(result.blocks[1].lines).toHaveLength(8);
    expect(result.blocks[1].lines[0]).toEqual({ type: 'chords', content: 'F#' });
    expect(result.blocks[1].lines[1]).toEqual({ type: 'lyrics', content: 'É tão profundo tão imenso, e cobre-nos' });
    expect(result.blocks[1].lines[2]).toEqual({ type: 'chords', content: ' C#' });
    expect(result.blocks[1].lines[3]).toEqual({ type: 'lyrics', content: 'Furioso, Poderoso, Abraça-nos' });
    expect(result.blocks[1].lines[4]).toEqual({ type: 'chords', content: ' F#' });
    expect(result.blocks[1].lines[5]).toEqual({ type: 'lyrics', content: 'Só Ele pode devolver' });
    expect(result.blocks[1].lines[6]).toEqual({ type: 'chords', content: '                C#' });
    expect(result.blocks[1].lines[7]).toEqual({ type: 'lyrics', content: 'A vida aos corações' });
  });

  it('should handle leading and trailing empty lines', () => {
    const input = `

Quebrantado
Vineyard

Eu olho para a cruz

`;

    const result = parseSongText(input);

    expect(result.title).toBe('Quebrantado');
    expect(result.artist).toBe('Vineyard');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].lines).toEqual([
      { type: 'lyrics', content: 'Eu olho para a cruz' },
    ]);
  });

  it('should parse a song with title only (no artist) followed by an empty line', () => {
    const input = `Quebrantado

Eu olho para a cruz
Para a cruz eu vou
Do seu sofrer, participar
Sua obra, vou cantar

Meu salvador
Na cruz, mostrou
O amor do pai
O justo Deus`;

    const result = parseSongText(input);

    expect(result.title).toBe('Quebrantado');
    expect(result.artist).toBe('');
    expect(result.blocks).toHaveLength(2);

    expect(result.blocks[0].lines).toEqual([
      { type: 'lyrics', content: 'Eu olho para a cruz' },
      { type: 'lyrics', content: 'Para a cruz eu vou' },
      { type: 'lyrics', content: 'Do seu sofrer, participar' },
      { type: 'lyrics', content: 'Sua obra, vou cantar' },
    ]);

    expect(result.blocks[1].lines).toEqual([
      { type: 'lyrics', content: 'Meu salvador' },
      { type: 'lyrics', content: 'Na cruz, mostrou' },
      { type: 'lyrics', content: 'O amor do pai' },
      { type: 'lyrics', content: 'O justo Deus' },
    ]);
  });

  it('should handle multiple consecutive empty lines between blocks', () => {
    const input = `Title

First block


Second block`;

    const result = parseSongText(input);

    expect(result.title).toBe('Title');
    expect(result.artist).toBe('');
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].lines).toEqual([
      { type: 'lyrics', content: 'First block' },
    ]);
    expect(result.blocks[1].lines).toEqual([
      { type: 'lyrics', content: 'Second block' },
    ]);
  });

  it('should return empty blocks for empty input', () => {
    const result = parseSongText('');

    expect(result.title).toBe('');
    expect(result.artist).toBe('');
    expect(result.blocks).toHaveLength(0);
  });

  it('should detect guitar tablature lines as comments', () => {
    const input = `E|4-12----------|
B|-----15-12/15-|
G|--------------|
D|--------------|
A|--------------|
E|--------------|

Am
Some lyrics here`;

    const result = parseSongText(input);

    expect(result.title).toBe('');
    expect(result.artist).toBe('');
    expect(result.blocks).toHaveLength(2);

    // Tab block: all lines should be comments
    expect(result.blocks[0].lines).toHaveLength(6);
    for (const line of result.blocks[0].lines) {
      expect(line.type).toBe('comments');
    }
    expect(result.blocks[0].lines[0]).toEqual({ type: 'comments', content: 'E|4-12----------|' });
    expect(result.blocks[0].lines[1]).toEqual({ type: 'comments', content: 'B|-----15-12/15-|' });

    // Second block: chord + lyrics
    expect(result.blocks[1].lines).toHaveLength(2);
    expect(result.blocks[1].lines[0].type).toBe('chords');
    expect(result.blocks[1].lines[1].type).toBe('lyrics');
  });

  it('should NOT insert an empty block between parts separated by 1 empty line', () => {
    // Use chord lines so the header detection does not consume lines as title/artist
    const input = `C G Am F
Verse line one

G C F G
Verse line two`;

    const result = parseSongText(input);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].lines).toHaveLength(2);
    expect(result.blocks[1].lines).toHaveLength(2);
  });

  it('should NOT insert an empty block between parts separated by 2 empty lines', () => {
    const input = `C G Am F
Verse line one


G C F G
Verse line two`;

    const result = parseSongText(input);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].lines).toHaveLength(2);
    expect(result.blocks[1].lines).toHaveLength(2);
  });

  it('should insert an empty block between parts separated by exactly 3 empty lines', () => {
    const input = `C G Am F
Verse line one



G C F G
Verse line two`;

    const result = parseSongText(input);

    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0].lines).toHaveLength(2);
    expect(result.blocks[1].lines).toHaveLength(0);
    expect(result.blocks[2].lines).toHaveLength(2);
  });

  it('should insert an empty block between parts separated by more than 3 empty lines', () => {
    const input = `C G Am F
Verse line one




G C F G
Verse line two`;

    const result = parseSongText(input);

    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0].lines).toHaveLength(2);
    expect(result.blocks[1].lines).toHaveLength(0);
    expect(result.blocks[2].lines).toHaveLength(2);
  });

  it('should insert multiple empty blocks when multiple 3+ empty line gaps exist', () => {
    const input = `C G Am
Part A



G C F
Part B



Am F C
Part C`;

    const result = parseSongText(input);

    expect(result.blocks).toHaveLength(5);
    expect(result.blocks[0].lines).toHaveLength(2);
    expect(result.blocks[1].lines).toHaveLength(0);
    expect(result.blocks[2].lines).toHaveLength(2);
    expect(result.blocks[3].lines).toHaveLength(0);
    expect(result.blocks[4].lines).toHaveLength(2);
  });
});

describe('transposeNote', () => {
  it('transposes up with sharps', () => {
    expect(transposeNote('C', 1, false)).toBe('C#');
    expect(transposeNote('B', 1, false)).toBe('C');
    expect(transposeNote('E', 1, false)).toBe('F');
  });

  it('transposes down with flats', () => {
    expect(transposeNote('C', -1, true)).toBe('B');
    expect(transposeNote('D', -1, true)).toBe('Db');
    expect(transposeNote('F', -1, true)).toBe('E');
  });

  it('wraps around the octave', () => {
    expect(transposeNote('C', 12, false)).toBe('C');
    expect(transposeNote('G#', 3, false)).toBe('B');
  });
});

describe('transposeChordToken', () => {
  it('transposes a simple chord up', () => {
    expect(transposeChordToken('C', 1, false)).toBe('C#');
    expect(transposeChordToken('B', 1, false)).toBe('C');
  });

  it('transposes a chord with suffix', () => {
    expect(transposeChordToken('F#m', 1, false)).toBe('Gm');
    expect(transposeChordToken('Cmaj7', 2, false)).toBe('Dmaj7');
    expect(transposeChordToken('Asus4', -1, true)).toBe('Absus4');
  });

  it('transposes a chord with bass note', () => {
    expect(transposeChordToken('G/B', 1, false)).toBe('G#/C');
    expect(transposeChordToken('C/E', 2, false)).toBe('D/F#');
    expect(transposeChordToken('Cmaj7/E', 1, false)).toBe('C#maj7/F');
  });

  it('transposes flat chords', () => {
    expect(transposeChordToken('Bb', 2, false)).toBe('C');
    expect(transposeChordToken('Eb', -1, true)).toBe('D');
  });
});

describe('transposeLine', () => {
  it('transposes all chords in a line upward', () => {
    // C+1=C#, Am+1=A#m, F+1=F#, G+1=G#; spacing: C(1)→C#(2) eats 1 space, A#m(3) same as Am(2)+1 eats 1
    expect(transposeLine(' C  Am  F  G ', 1, false)).toBe(' C# A#m F# G#');
  });

  it('transposes all chords in a line downward with flats', () => {
    // C-1=B, Am-1=Abm, F-1=E, G-1=Gb
    expect(transposeLine(' C  Am  F  G ', -1, true)).toBe(' B  Abm E  Gb');
  });

  it('preserves column alignment when token length changes', () => {
    // D→E (same), Bm→C#m (+1 eats 1 trailing space), G→A (same), A→B (same)
    expect(transposeLine(' D    Bm   G    A', 2, false)).toBe(' E    C#m  A    B');
    // C#→C (-1, gain 1 space), Am→Abm (+1, eat 1 space), F#→F (-1, gain 1 space), G#→G (-1, gain 1 space)
    expect(transposeLine(' C#  Am  F#  G#', -1, true)).toBe(' C   Abm F   G');
  });

  it('handles a line with a single chord', () => {
    expect(transposeLine(' Am ', 2, false)).toBe(' Bm');
  });
});

describe('swapAccidentals', () => {
  it('converts sharps to flats when sharps dominate', () => {
    expect(swapAccidentals(' C#  F#  G#')).toBe(' Db  Gb  Ab');
  });

  it('converts flats to sharps when flats dominate', () => {
    expect(swapAccidentals(' Db  Gb  Ab')).toBe(' C#  F#  G#');
  });

  it('handles mixed lines, converting everything to flats when sharps dominate', () => {
    // 2 sharps, 1 flat → target is flats; Bb is already flat so it stays Bb
    expect(swapAccidentals(' C#  F#  Bb')).toBe(' Db  Gb  Bb');
  });

  it('does not alter natural notes', () => {
    expect(swapAccidentals(' C  Am  F  G')).toBe(' C  Am  F  G');
  });
});

// ─── Reference URL helpers ────────────────────────────────────────────────────

describe('getSpotifyTrackId', () => {
  it('extracts track ID from a standard URL', () => {
    expect(getSpotifyTrackId('https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6')).toBe('6rqhFgbbKwnb9MLmUQDhG6');
  });

  it('extracts track ID with query params', () => {
    expect(getSpotifyTrackId('https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6?si=abc123')).toBe('6rqhFgbbKwnb9MLmUQDhG6');
  });

  it('returns null for non-track Spotify URLs', () => {
    expect(getSpotifyTrackId('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy')).toBeNull();
    expect(getSpotifyTrackId('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')).toBeNull();
  });

  it('returns null for non-Spotify URLs', () => {
    expect(getSpotifyTrackId('https://www.youtube.com/watch?v=abc')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(getSpotifyTrackId('not-a-url')).toBeNull();
  });
});

describe('getYouTubeVideoId', () => {
  it('extracts video ID from standard youtube.com URL', () => {
    expect(getYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from music.youtube.com', () => {
    expect(getYouTubeVideoId('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from youtu.be short URL', () => {
    expect(getYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for youtube.com without v param', () => {
    expect(getYouTubeVideoId('https://www.youtube.com/channel/UC123')).toBeNull();
  });

  it('returns null for empty youtu.be path', () => {
    expect(getYouTubeVideoId('https://youtu.be/')).toBeNull();
  });

  it('returns null for non-YouTube URLs', () => {
    expect(getYouTubeVideoId('https://vimeo.com/123456')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(getYouTubeVideoId('not-a-url')).toBeNull();
  });
});

describe('getDeezerTrackId', () => {
  it('extracts track ID from a standard URL', () => {
    expect(getDeezerTrackId('https://www.deezer.com/track/3135556')).toBe('3135556');
  });

  it('extracts track ID with locale prefix', () => {
    expect(getDeezerTrackId('https://www.deezer.com/en/track/3135556')).toBe('3135556');
    expect(getDeezerTrackId('https://www.deezer.com/pt-br/track/3135556')).toBe('3135556');
  });

  it('extracts track ID with query params', () => {
    expect(getDeezerTrackId('https://www.deezer.com/track/3135556?utm_source=test')).toBe('3135556');
  });

  it('returns null for non-track Deezer URLs', () => {
    expect(getDeezerTrackId('https://www.deezer.com/album/302127')).toBeNull();
    expect(getDeezerTrackId('https://www.deezer.com/playlist/1479458365')).toBeNull();
  });

  it('returns null for non-Deezer URLs', () => {
    expect(getDeezerTrackId('https://www.spotify.com/track/123')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(getDeezerTrackId('not-a-url')).toBeNull();
  });
});

describe('getDeezerShareUrl', () => {
  it('returns the URL for a valid share link', () => {
    const url = 'https://link.deezer.com/s/32TkH6hCqKdAEKktEboCJ';
    expect(getDeezerShareUrl(url)).toBe(url);
  });

  it('returns null for standard deezer.com URLs', () => {
    expect(getDeezerShareUrl('https://www.deezer.com/track/3135556')).toBeNull();
  });

  it('returns null for link.deezer.com without /s/ path', () => {
    expect(getDeezerShareUrl('https://link.deezer.com/')).toBeNull();
    expect(getDeezerShareUrl('https://link.deezer.com/other')).toBeNull();
  });

  it('returns null for non-Deezer URLs', () => {
    expect(getDeezerShareUrl('https://www.spotify.com/track/123')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(getDeezerShareUrl('not-a-url')).toBeNull();
  });
});

describe('getSoundCloudUrl', () => {
  it('returns the URL for a valid track URL', () => {
    const url = 'https://soundcloud.com/forss/flickermood';
    expect(getSoundCloudUrl(url)).toBe(url);
  });

  it('returns the URL with www prefix', () => {
    const url = 'https://www.soundcloud.com/artist/track-name';
    expect(getSoundCloudUrl(url)).toBe(url);
  });

  it('returns the URL for nested paths (sets)', () => {
    const url = 'https://soundcloud.com/artist/sets/album-name';
    expect(getSoundCloudUrl(url)).toBe(url);
  });

  it('returns null for soundcloud.com root (no track)', () => {
    expect(getSoundCloudUrl('https://soundcloud.com/')).toBeNull();
  });

  it('returns null for user-only URL (single segment)', () => {
    expect(getSoundCloudUrl('https://soundcloud.com/forss')).toBeNull();
  });

  it('returns null for non-SoundCloud URLs', () => {
    expect(getSoundCloudUrl('https://www.youtube.com/watch?v=abc')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(getSoundCloudUrl('not-a-url')).toBeNull();
  });
});

describe('getAppleMusicEmbedUrl', () => {
  it('transforms an album URL to embed URL', () => {
    const url = 'https://music.apple.com/us/album/some-album/1440837641';
    const result = getAppleMusicEmbedUrl(url);
    expect(result).toBe('https://embed.music.apple.com/us/album/some-album/1440837641');
  });

  it('transforms an album URL with track param to embed URL', () => {
    const url = 'https://music.apple.com/us/album/some-album/1440837641?i=1440837643';
    const result = getAppleMusicEmbedUrl(url);
    expect(result).toBe('https://embed.music.apple.com/us/album/some-album/1440837641?i=1440837643');
  });

  it('transforms a song URL to embed URL', () => {
    const url = 'https://music.apple.com/us/song/some-song/1440837643';
    const result = getAppleMusicEmbedUrl(url);
    expect(result).toBe('https://embed.music.apple.com/us/song/some-song/1440837643');
  });

  it('returns null for non-album/song Apple Music URLs', () => {
    expect(getAppleMusicEmbedUrl('https://music.apple.com/us/artist/some-artist/123')).toBeNull();
    expect(getAppleMusicEmbedUrl('https://music.apple.com/us/playlist/some-playlist/pl.123')).toBeNull();
  });

  it('returns null for non-Apple Music URLs', () => {
    expect(getAppleMusicEmbedUrl('https://www.spotify.com/track/123')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(getAppleMusicEmbedUrl('not-a-url')).toBeNull();
  });
});

describe('getTidalTrackId', () => {
  it('extracts track ID from tidal.com/browse/track URL', () => {
    expect(getTidalTrackId('https://tidal.com/browse/track/251380837')).toBe('251380837');
  });

  it('extracts track ID from listen.tidal.com/track URL', () => {
    expect(getTidalTrackId('https://listen.tidal.com/track/251380837')).toBe('251380837');
  });

  it('extracts track ID with query params', () => {
    expect(getTidalTrackId('https://tidal.com/browse/track/251380837?u')).toBe('251380837');
  });

  it('returns null for non-track Tidal URLs', () => {
    expect(getTidalTrackId('https://tidal.com/browse/album/251380835')).toBeNull();
    expect(getTidalTrackId('https://tidal.com/browse/playlist/abc-123')).toBeNull();
  });

  it('returns null for non-Tidal URLs', () => {
    expect(getTidalTrackId('https://www.spotify.com/track/123')).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(getTidalTrackId('not-a-url')).toBeNull();
  });
});

describe('getReferenceType', () => {
  it('identifies Spotify URLs', () => {
    expect(getReferenceType('https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6')).toBe('spotify');
  });

  it('identifies YouTube URLs', () => {
    expect(getReferenceType('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    expect(getReferenceType('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(getReferenceType('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
  });

  it('identifies Deezer URLs', () => {
    expect(getReferenceType('https://www.deezer.com/track/3135556')).toBe('deezer');
    expect(getReferenceType('https://www.deezer.com/en/track/3135556')).toBe('deezer');
    expect(getReferenceType('https://link.deezer.com/s/32TkH6hCqKdAEKktEboCJ')).toBe('deezer');
  });

  it('identifies SoundCloud URLs', () => {
    expect(getReferenceType('https://soundcloud.com/forss/flickermood')).toBe('soundcloud');
  });

  it('identifies Apple Music URLs', () => {
    expect(getReferenceType('https://music.apple.com/us/album/some-album/1440837641?i=1440837643')).toBe('apple-music');
    expect(getReferenceType('https://music.apple.com/us/song/some-song/1440837643')).toBe('apple-music');
  });

  it('identifies Tidal URLs', () => {
    expect(getReferenceType('https://tidal.com/browse/track/251380837')).toBe('tidal');
    expect(getReferenceType('https://listen.tidal.com/track/251380837')).toBe('tidal');
  });

  it('returns other for unrecognized URLs', () => {
    expect(getReferenceType('https://www.example.com/song')).toBe('other');
    expect(getReferenceType('https://bandcamp.com/track/something')).toBe('other');
  });
});
