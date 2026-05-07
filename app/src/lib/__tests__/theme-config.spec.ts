import { describe, it, expect } from 'vitest';
import {
  getDefaultThemeConfig,
  mergeThemeConfig,
  mergeTheme,
} from '../theme-config';
import {
  ITeleprompterThemeConfig,
  ITheme,
  TeleprompterTheme,
  LyricsTheme,
} from '@/types';

describe('theme-config', () => {
  describe('getDefaultThemeConfig', () => {
    it('returns lyrics defaults', () => {
      const cfg = getDefaultThemeConfig('lyrics');
      expect(cfg).toEqual(LyricsTheme.config);
    });

    it('returns teleprompter defaults including comments', () => {
      const cfg = getDefaultThemeConfig('teleprompter') as ITeleprompterThemeConfig;
      expect(cfg.comments).toBeDefined();
      expect(cfg.comments.enabled).toBe(true);
    });

    it('returns a deep clone (mutation does not affect defaults)', () => {
      const cfg = getDefaultThemeConfig('teleprompter') as ITeleprompterThemeConfig;
      cfg.title.fontSize = 9999;
      const fresh = getDefaultThemeConfig('teleprompter') as ITeleprompterThemeConfig;
      expect(fresh.title.fontSize).not.toBe(9999);
    });
  });

  describe('mergeThemeConfig', () => {
    it('returns defaults when stored is undefined', () => {
      const cfg = mergeThemeConfig('teleprompter', undefined);
      expect(cfg).toEqual(TeleprompterTheme.config);
    });

    it('returns defaults when stored is null', () => {
      const cfg = mergeThemeConfig('teleprompter', null);
      expect(cfg).toEqual(TeleprompterTheme.config);
    });

    it('fills in missing comments from defaults for teleprompter', () => {
      // Reproduces the reported bug: stored config without `comments`.
      const stored = {
        backgroundColor: '#000000',
        foregroundColor: '#ffffff',
        invisibleOnEmptyItems: true,
        title: {
          fontSize: 220,
          fontWeight: 700,
          fontFamily: 'font-source-code-pro',
          transform: 'none' as const,
          italic: false,
          shadow: { enabled: false },
        },
        artist: {
          fontSize: 180,
          fontWeight: 500,
          fontFamily: 'font-source-code-pro',
          transform: 'none' as const,
          italic: false,
          shadow: { enabled: false },
        },
        lyrics: {
          fontSize: 220,
          fontWeight: 400,
          fontFamily: 'font-source-code-pro',
          transform: 'none' as const,
          italic: false,
          shadow: { enabled: false },
        },
        chords: {
          fontSize: 220,
          fontWeight: 700,
          fontFamily: 'font-source-code-pro',
          transform: 'none' as const,
          italic: false,
          shadow: { enabled: false },
          color: '#ffdf20',
          enabled: true,
        },
        clock: {
          fontSize: 180,
          fontWeight: 500,
          fontFamily: 'font-source-code-pro',
          transform: 'none' as const,
          italic: false,
          shadow: { enabled: false },
          color: '#ffffff',
          enabled: true,
          format: '24withSeconds' as const,
        },
      };

      const merged = mergeThemeConfig('teleprompter', stored) as ITeleprompterThemeConfig;
      expect(merged.comments).toBeDefined();
      expect(merged.comments.enabled).toBe(true);
      expect(merged.comments.color).toBe('#00a63e');
      expect(merged.comments.fontFamily).toBe('font-source-code-pro');
    });

    it('preserves stored leaf overrides over defaults', () => {
      const merged = mergeThemeConfig('teleprompter', {
        title: {
          fontSize: 999,
          fontWeight: 700,
          fontFamily: 'font-source-code-pro',
          transform: 'none',
          italic: false,
          shadow: { enabled: false },
        },
      } as Partial<ITeleprompterThemeConfig>) as ITeleprompterThemeConfig;
      expect(merged.title.fontSize).toBe(999);
    });

    it('preserves falsy stored values (false, 0, "")', () => {
      const merged = mergeThemeConfig('lyrics', {
        invisibleOnEmptyItems: false,
        backgroundColor: '#000000',
      });
      expect(merged.invisibleOnEmptyItems).toBe(false);
      expect(merged.backgroundColor).toBe('#000000');
    });

    it('does not add chords/comments/clock when extends is lyrics', () => {
      const merged = mergeThemeConfig('lyrics', {}) as unknown as Record<string, unknown>;
      expect(merged.chords).toBeUndefined();
      expect(merged.comments).toBeUndefined();
      expect(merged.clock).toBeUndefined();
    });

    it('fills missing nested fields (e.g. clock missing color)', () => {
      const merged = mergeThemeConfig('teleprompter', {
        clock: {
          enabled: false,
        } as ITeleprompterThemeConfig['clock'],
      }) as ITeleprompterThemeConfig;
      expect(merged.clock.enabled).toBe(false); // preserved
      expect(merged.clock.color).toBe('#ffffff'); // from defaults
      expect(merged.clock.format).toBe('24withSeconds'); // from defaults
    });

    it('does not mutate the defaults object across calls', () => {
      const a = mergeThemeConfig('teleprompter', {
        title: {
          fontSize: 111,
          fontWeight: 700,
          fontFamily: 'font-source-code-pro',
          transform: 'none',
          italic: false,
          shadow: { enabled: false },
        },
      } as Partial<ITeleprompterThemeConfig>) as ITeleprompterThemeConfig;
      const b = mergeThemeConfig('teleprompter', undefined) as ITeleprompterThemeConfig;
      expect(a.title.fontSize).toBe(111);
      expect(b.title.fontSize).toBe(TeleprompterTheme.config!.title.fontSize);
    });
  });

  describe('mergeTheme', () => {
    it('merges the config of a theme', () => {
      const theme: ITheme = {
        id: 1,
        name: 'test',
        extends: 'teleprompter',
        config: {
          backgroundColor: '#111111',
        } as ITeleprompterThemeConfig,
      };
      const merged = mergeTheme(theme);
      expect(merged.id).toBe(1);
      expect(merged.name).toBe('test');
      expect(merged.config?.backgroundColor).toBe('#111111');
      expect((merged.config as ITeleprompterThemeConfig).comments).toBeDefined();
    });

    it('returns defaults when theme has no config', () => {
      const theme: ITheme = {
        id: 1,
        name: 'test',
        extends: 'teleprompter',
      };
      const merged = mergeTheme(theme);
      expect(merged.config).toEqual(TeleprompterTheme.config);
    });
  });
});
