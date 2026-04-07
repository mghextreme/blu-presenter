import {
  ILyricsThemeConfig,
  ISubtitlesThemeConfig,
  ITeleprompterThemeConfig,
  ITheme,
} from "./theme.interface";

export const LyricsTheme = {
  id: 0,
  name: 'lyrics',
  extends: 'lyrics',
  config: {
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
    alignment: 'center',
    position: 'middle',
  } as ILyricsThemeConfig
} as ITheme;

export const SubtitlesTheme = {
  id: 0,
  name: 'subtitles',
  extends: 'subtitles',
  config: {
    backgroundColor: '#00ff00',
    foregroundColor: '#ffffff',
    invisibleOnEmptyItems: false,
    title: {
      fontFamily: 'font-open-sans',
      fontSize: 125,
      fontWeight: 700,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: true,
        color: '#000000',
        blur: 0,
        offset: 8
      },
    },
    artist: {
      fontFamily: 'font-open-sans',
      fontSize: 75,
      fontWeight: 500,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: true,
        color: '#000000',
        blur: 0,
        offset: 8
      },
    },
    lyrics: {
      fontFamily: 'font-open-sans',
      fontSize: 100,
      fontWeight: 500,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: true,
        color: '#000000',
        blur: 0,
        offset: 8
      },
    },
    alignment: 'center',
    position: 'bottom',
  } as ISubtitlesThemeConfig
} as ITheme;

export const TeleprompterTheme = {
  id: 0,
  name: 'teleprompter',
  extends: 'teleprompter',
  config: {
    backgroundColor: '#000000',
    foregroundColor: '#ffffff',
    invisibleOnEmptyItems: false,
    title: {
      fontFamily: 'font-source-code-pro',
      fontSize: 180,
      fontWeight: 700,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: false,
      },
    },
    artist: {
      fontFamily: 'font-source-code-pro',
      fontSize: 120,
      fontWeight: 500,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: false,
      },
    },
    lyrics: {
      fontFamily: 'font-source-code-pro',
      fontSize: 150,
      fontWeight: 400,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: false,
      },
    },
    chords: {
      enabled: true,
      fontFamily: 'font-source-code-pro',
      color: '#ffdf20',
      fontSize: 150,
      fontWeight: 700,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: false,
      },
    },
    comments: {
      enabled: true,
      fontFamily: 'font-source-code-pro',
      color: '#00a63e',
      fontSize: 120,
      fontWeight: 400,
      transform: 'none',
      italic: true,
      shadow: {
        enabled: false,
      },
    },
    clock: {
      enabled: true,
      fontFamily: 'font-source-code-pro',
      color: '#ffffff',
      fontSize: 150,
      fontWeight: 500,
      transform: 'none',
      italic: false,
      format: '24withSeconds',
      shadow: {
        enabled: false,
      },
    }
  } as ITeleprompterThemeConfig
} as ITheme;
