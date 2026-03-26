import { describe, it, expect } from 'vitest'
import { parseSongText } from '../songs'

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
