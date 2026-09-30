import {
  SongExportData,
  SongTextFormatError,
  SongTextFormatService,
} from '../song-text-format.service';

const V1_CHORDS = 'F#            A#m';
const V1_CHORDS_2 = '         D';
const CH_CHORDS = 'D            A';

const sampleSong: SongExportData = {
  title: 'Amazing Grace',
  artist: 'John Newton',
  language: 'en',
  blocks: [
    {
      name: 'Verse 1',
      acronym: 'V1',
      lines: [
        { type: 'chords', content: V1_CHORDS },
        { type: 'lyrics', content: 'Amazing grace, how sweet the sound' },
        { type: 'chords', content: V1_CHORDS_2 },
        { type: 'lyrics', content: 'I once was lost, but now am found' },
      ],
    },
    {
      name: 'Chorus',
      acronym: 'CH',
      lines: [
        { type: 'comments', content: 'Key change on the last repeat' },
        { type: 'chords', content: CH_CHORDS },
        { type: 'lyrics', content: 'My chains are gone' },
        { type: 'lyrics', content: '' },
        { type: 'lyrics', content: "I've been set free" },
      ],
    },
  ],
  references: [{ url: 'https://open.spotify.com/track/xxxx', name: 'Spotify' }],
};

const GOLDEN = `---
schemaVersion: 1
language: en
references:
  - url: https://open.spotify.com/track/xxxx
    name: Spotify
---

# Amazing Grace
## John Newton

### [V1] Verse 1
* ${V1_CHORDS}
- Amazing grace, how sweet the sound
* ${V1_CHORDS_2}
- I once was lost, but now am found

### [CH] Chorus
> Key change on the last repeat
* ${CH_CHORDS}
- My chains are gone
-
- I've been set free
`;

describe('SongTextFormatService', () => {
  let service: SongTextFormatService;

  beforeEach(() => {
    service = new SongTextFormatService();
  });

  describe('encode', () => {
    it('encodes the golden sample', () => {
      expect(service.encode(sampleSong)).toBe(GOLDEN);
    });

    it('omits null language and empty references from frontmatter', () => {
      const text = service.encode({
        title: 'T',
        artist: 'A',
        language: null,
        blocks: [],
        references: [],
      });
      expect(text).toBe('---\nschemaVersion: 1\n---\n\n# T\n## A\n');
    });

    it('emits bare prefix for empty lines and strips trailing whitespace', () => {
      const text = service.encode({
        title: 'T',
        artist: 'A',
        language: undefined,
        blocks: [
          {
            name: 'P',
            lines: [
              { type: 'lyrics', content: 'x   ' },
              { type: 'chords', content: '  ' },
              { type: 'comments', content: '' },
            ],
          },
        ],
        references: [],
      });
      expect(text).toBe(
        '---\nschemaVersion: 1\n---\n\n# T\n## A\n\n### P\n- x\n*\n>\n',
      );
    });

    it('supports unnamed parts, acronym-only parts and empty parts', () => {
      const text = service.encode({
        title: 'T',
        artist: 'A',
        language: undefined,
        blocks: [
          { lines: [] },
          { acronym: 'X2', lines: [] },
          { name: 'Bridge', lines: [] },
        ],
        references: [],
      });
      expect(text).toBe(
        '---\nschemaVersion: 1\n---\n\n# T\n## A\n\n###\n\n### [X2]\n\n### Bridge\n',
      );
    });

    it('collapses newlines in title and artist', () => {
      const text = service.encode({
        title: 'First\r\nSecond',
        artist: 'One\nTwo',
        language: undefined,
        blocks: [],
        references: [],
      });
      expect(text).toBe(
        '---\nschemaVersion: 1\n---\n\n# First Second\n## One Two\n',
      );
    });

    it('emits references without name as url-only entries', () => {
      const text = service.encode({
        title: 'T',
        artist: 'A',
        language: undefined,
        blocks: [],
        references: [{ url: 'https://example.com' }],
      });
      expect(text).toContain('references:\n  - url: https://example.com\n');
    });
  });

  describe('decode', () => {
    it('decodes the golden sample', () => {
      expect(service.decode(GOLDEN)).toEqual(sampleSong);
    });

    it('tolerates CRLF line endings and trailing whitespace', () => {
      const crlf = GOLDEN.replace(/\n/g, '\r\n').replace(/en\r\n/g, 'en  \r\n');
      expect(service.decode(crlf)).toEqual(sampleSong);
    });

    it('ignores unknown frontmatter keys and defaults optional fields', () => {
      const text =
        '---\nschemaVersion: 1\nfutureKey: whatever\n---\n\n# T\n## A\n';
      expect(service.decode(text)).toEqual({
        title: 'T',
        artist: 'A',
        language: null,
        blocks: [],
        references: [],
      });
    });

    it('accepts minor schema versions', () => {
      const text = '---\nschemaVersion: 1.1\n---\n\n# T\n## A\n';
      expect(service.decode(text)).toEqual({
        title: 'T',
        artist: 'A',
        language: null,
        blocks: [],
        references: [],
      });
    });

    it('rejects missing frontmatter', () => {
      expect(() => service.decode('# T\n## A\n')).toThrow(SongTextFormatError);
      expect(() => service.decode('# T\n## A\n')).toThrow(
        /Missing frontmatter/,
      );
    });

    it('rejects unterminated frontmatter', () => {
      expect(() => service.decode('---\nschemaVersion: 1\n# T\n')).toThrow(
        /Unterminated frontmatter/,
      );
    });

    it('rejects invalid YAML with the parse error', () => {
      expect(() => service.decode('---\na: b: c\n---\n\n# T\n## A\n')).toThrow(
        SongTextFormatError,
      );
      expect(() => service.decode('---\na: b: c\n---\n\n# T\n## A\n')).toThrow(
        /Invalid YAML frontmatter/,
      );
    });

    it('rejects unsupported schema versions', () => {
      expect(() =>
        service.decode('---\nschemaVersion: 2\n---\n\n# T\n## A\n'),
      ).toThrow(/Unsupported schemaVersion 2/);
      expect(() => service.decode('---\n---\n\n# T\n## A\n')).toThrow(
        /Unsupported schemaVersion/,
      );
    });

    it('rejects a missing title with a line number', () => {
      const text = '---\nschemaVersion: 1\n---\n\n### P\n';
      expect(() => service.decode(text)).toThrow(/Expected the song title/);
      try {
        service.decode(text);
      } catch (error) {
        expect((error as SongTextFormatError).line).toBe(5);
      }
    });

    it('rejects a missing artist', () => {
      expect(() =>
        service.decode('---\nschemaVersion: 1\n---\n\n# T\n\n### P\n'),
      ).toThrow(/Expected the artist/);
    });

    it('rejects content before the first part header with a line number', () => {
      const text = '---\nschemaVersion: 1\n---\n\n# T\n## A\nhello\n';
      expect(() => service.decode(text)).toThrow(
        /Content before the first part header/,
      );
      try {
        service.decode(text);
      } catch (error) {
        expect((error as SongTextFormatError).line).toBe(7);
      }
    });

    it('rejects unexpected lines and level 4+ headers', () => {
      expect(() =>
        service.decode(
          '---\nschemaVersion: 1\n---\n\n# T\n## A\n\n### P\nfoo bar\n',
        ),
      ).toThrow(/Unexpected line/);
      expect(() =>
        service.decode(
          '---\nschemaVersion: 1\n---\n\n# T\n## A\n\n#### Deep\n',
        ),
      ).toThrow(/Headers deeper than level 3/);
    });

    it('rejects invalid language and references', () => {
      expect(() =>
        service.decode(
          '---\nschemaVersion: 1\nlanguage: eng\n---\n\n# T\n## A\n',
        ),
      ).toThrow(/Invalid language/);
      expect(() =>
        service.decode(
          '---\nschemaVersion: 1\nreferences: notalist\n---\n\n# T\n## A\n',
        ),
      ).toThrow(/must be a list/);
      expect(() =>
        service.decode(
          '---\nschemaVersion: 1\nreferences:\n  - name: no url\n---\n\n# T\n## A\n',
        ),
      ).toThrow(/url must be a non-empty string/);
    });
  });

  describe('round trip', () => {
    it('decode(encode(song)) deep-equals the original song', () => {
      expect(service.decode(service.encode(sampleSong))).toEqual(sampleSong);
    });

    it('encode is idempotent', () => {
      const once = service.encode(sampleSong);
      expect(service.encode(service.decode(once))).toBe(once);
    });

    it('round-trips edge-case songs', () => {
      const edgeSong: SongExportData = {
        title: 'Song with # hashes and "quotes"',
        artist: "O'Brien & Sons",
        language: null,
        blocks: [
          {
            lines: [
              { type: 'lyrics', content: '# not a header' },
              { type: 'lyrics', content: '> not a quote' },
              { type: 'lyrics', content: '- not a list' },
              { type: 'lyrics', content: '* not a list either' },
              { type: 'lyrics', content: '---' },
            ],
          },
          {
            name: 'Verse',
            acronym: 'V1',
            lines: [
              { type: 'chords', content: '  Am7' },
              { type: 'lyrics', content: '  indented lyric' },
              { type: 'chords', content: '' },
              { type: 'comments', content: 'note: colons, *stars*, -dashes-' },
            ],
          },
          { name: '[Not a tag] intro', lines: [] },
          { acronym: 'X2', lines: [] },
          { name: 'Chorus', acronym: 'CH', lines: [] },
        ],
        references: [],
      };

      expect(service.decode(service.encode(edgeSong))).toEqual(edgeSong);
    });
  });
});
