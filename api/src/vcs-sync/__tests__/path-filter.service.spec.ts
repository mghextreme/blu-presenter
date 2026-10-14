import { PathFilterService } from '../path-filter.service';

describe('PathFilterService', () => {
  let service: PathFilterService;

  beforeEach(() => {
    service = new PathFilterService();
  });

  describe('matches', () => {
    it('matches markdown files with the default include pattern', () => {
      expect(
        service.matches('en/john-newton/amazing-grace.md', {
          includePatterns: null,
          excludePatterns: null,
        }),
      ).toBe(true);
      expect(service.matches('amazing-grace.md', {})).toBe(true);
    });

    it('rejects non-markdown files even when the include pattern matches', () => {
      expect(
        service.matches('en/readme.txt', { includePatterns: ['**/*'] }),
      ).toBe(false);
    });

    it('accepts uppercase extensions', () => {
      expect(service.matches('en/SONG.MD', {})).toBe(true);
    });

    it('rejects paths excluded by the exclude patterns', () => {
      expect(
        service.matches('drafts/song.md', {
          includePatterns: null,
          excludePatterns: ['drafts/**'],
        }),
      ).toBe(false);
      expect(
        service.matches('en/song.md', {
          includePatterns: null,
          excludePatterns: ['drafts/**'],
        }),
      ).toBe(true);
    });

    it('requires at least one include pattern match', () => {
      expect(
        service.matches('en/song.md', { includePatterns: ['fi/**'] }),
      ).toBe(false);
      expect(
        service.matches('fi/song.md', { includePatterns: ['fi/**'] }),
      ).toBe(true);
    });
  });

  describe('toRelativePath', () => {
    it('strips the basePath prefix', () => {
      expect(
        service.toRelativePath('songs/en/song.md', { basePath: 'songs/' }),
      ).toBe('en/song.md');
      expect(
        service.toRelativePath('songs/en/song.md', { basePath: 'songs' }),
      ).toBe('en/song.md');
    });

    it('returns the path untouched without a basePath', () => {
      expect(service.toRelativePath('en/song.md', { basePath: '' })).toBe(
        'en/song.md',
      );
    });

    it('returns null for paths outside the basePath', () => {
      expect(
        service.toRelativePath('other/en/song.md', { basePath: 'songs' }),
      ).toBeNull();
      expect(service.toRelativePath('songs', { basePath: 'songs' })).toBeNull();
    });
  });

  describe('toAbsolutePath', () => {
    it('prepends the basePath', () => {
      expect(service.toAbsolutePath('en/song.md', { basePath: 'songs' })).toBe(
        'songs/en/song.md',
      );
      expect(service.toAbsolutePath('en/song.md', { basePath: '' })).toBe(
        'en/song.md',
      );
    });
  });

  describe('normalizeBasePath', () => {
    it('strips leading and trailing slashes', () => {
      expect(service.normalizeBasePath('/songs/')).toBe('songs');
      expect(service.normalizeBasePath('songs')).toBe('songs');
      expect(service.normalizeBasePath(null)).toBe('');
    });
  });
});
