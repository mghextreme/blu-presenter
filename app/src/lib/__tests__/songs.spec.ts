import { describe, it, expect } from 'vitest'
import { parseSongText, transposeNote, transposeChordToken, transposeLine, swapAccidentals } from '../songs'

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
