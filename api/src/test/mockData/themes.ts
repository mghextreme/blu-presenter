import { Theme } from '../../entities';
import { CreateThemeDto, UpdateThemeDto } from '../../types';

export const createMockTheme = (
  id: number,
  orgId: number,
  name: string,
  themeType: 'lyrics' | 'subtitles' | 'teleprompter' = 'lyrics',
): Theme => ({
  id,
  orgId,
  name,
  extends: themeType,
  config: getMockConfig(themeType),
  organization: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

export const getMockConfig = (
  themeType: 'lyrics' | 'subtitles' | 'teleprompter',
) => {
  const baseConfig = {
    backgroundColor: '#000000',
    foregroundColor: '#ffffff',
    invisibleOnEmptyItems: false,
    title: {
      fontFamily: 'font-open-sans',
      fontSize: 125,
      fontWeight: 700,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: false,
      },
    },
    artist: {
      fontFamily: 'font-open-sans',
      fontSize: 75,
      fontWeight: 500,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: false,
      },
    },
    lyrics: {
      fontFamily: 'font-open-sans',
      fontSize: 100,
      fontWeight: 500,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: false,
      },
    },
    alignment: 'center' as const,
    position: 'middle' as const,
  };

  if (themeType === 'teleprompter') {
    return {
      ...baseConfig,
      chords: {
        enabled: true,
        fontFamily: 'font-source-code-pro',
        color: '#ffdf20',
        fontSize: 100,
        fontWeight: 700,
        transform: 'none',
        italic: false,
        shadow: {
          enabled: false,
        },
      },
      clock: {
        enabled: true,
        fontFamily: 'font-source-code-pro',
        color: '#ffffff',
        fontSize: 100,
        fontWeight: 500,
        transform: 'none',
        italic: false,
        format: '24withSeconds' as const,
        shadow: {
          enabled: false,
        },
      },
    };
  }

  return baseConfig;
};

export const mockLyricsTheme = createMockTheme(1, 1, 'Default Lyrics', 'lyrics');
export const mockSubtitlesTheme = createMockTheme(2, 1, 'Default Subtitles', 'subtitles');
export const mockTeleprompterTheme = createMockTheme(3, 1, 'Default Teleprompter', 'teleprompter');

export const mockThemes: Theme[] = [
  mockLyricsTheme,
  mockSubtitlesTheme,
  mockTeleprompterTheme,
];

export const createMockCreateThemeDto = (
  name: string = 'Test Theme',
  themeType: 'lyrics' | 'subtitles' | 'teleprompter' = 'lyrics',
): CreateThemeDto => ({
  name,
  extends: themeType,
  config: getMockConfig(themeType),
});

export const createMockUpdateThemeDto = (
  id: number,
  name: string = 'Updated Theme',
  themeType: 'lyrics' | 'subtitles' | 'teleprompter' = 'lyrics',
): UpdateThemeDto => ({
  id,
  name,
  extends: themeType,
  config: getMockConfig(themeType),
});

