export type BaseTheme = 'lyrics' | 'subtitles' | 'teleprompter';

export interface IShadowConfig {
  enabled: boolean
  color?: string
  blur?: number
  offset?: number
}

export interface IFontConfig {
  fontFamily: string
  fontSize: number
  fontWeight: number
  transform: 'none' | 'uppercase'
  italic: boolean
  shadow: IShadowConfig
}

interface IBaseThemeConfig {
  backgroundColor: string
  foregroundColor: string
  invisibleOnEmptyItems: boolean
  fontFamily?: string
  title: IFontConfig
  artist: IFontConfig
  lyrics: IFontConfig
  alignment?: 'left' | 'center' | 'right'
  position?: 'top' | 'middle' | 'bottom'
}

export interface ILyricsThemeConfig extends IBaseThemeConfig {

}

export interface ISubtitlesThemeConfig extends IBaseThemeConfig {

}

export interface ITeleprompterThemeConfig extends IBaseThemeConfig {
  chords: IFontConfig & { color: string, enabled: boolean }
  clock: IFontConfig & { color: string, enabled: boolean, format: '12' | '12withSeconds' | '24' | '24withSeconds' }
}

export interface ITheme {
  id: number
  name: string
  extends: BaseTheme
  config?: ILyricsThemeConfig | ISubtitlesThemeConfig | ITeleprompterThemeConfig
}

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
      fontSize: 110,
      fontWeight: 700,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: false,
      },
    },
    artist: {
      fontFamily: 'font-source-code-pro',
      fontSize: 90,
      fontWeight: 500,
      transform: 'none',
      italic: false,
      shadow: {
        enabled: false,
      },
    },
    lyrics: {
      fontFamily: 'font-source-code-pro',
      fontSize: 100,
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
      format: '24withSeconds',
      shadow: {
        enabled: false,
      },
    }
  } as ITeleprompterThemeConfig
} as ITheme;
