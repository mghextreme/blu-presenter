export type BaseTheme = 'lyrics' | 'subtitles' | 'teleprompter';

interface IFontConfig {
  fontFamily?: string
  fontSize: number
  fontWeight: number
  transform: 'none' | 'uppercase'
  italic: boolean
}

interface IBaseThemeConfig {
  backgroundColor: string
  foregroundColor: string
  fontFamily?: string
  title: IFontConfig
  artist: IFontConfig
  lyrics: IFontConfig
}

export interface ILyricsThemeConfig extends IBaseThemeConfig {

}

export interface ISubtitlesThemeConfig extends IBaseThemeConfig {
  position: 'top' | 'bottom'
}

export interface ITeleprompterThemeConfig extends IBaseThemeConfig {
  chords: IFontConfig & { color: string }
  clock?: IFontConfig
}

export interface ITheme {
  id: number
  title: string
  extends: BaseTheme
  config?: ILyricsThemeConfig | ISubtitlesThemeConfig | ITeleprompterThemeConfig
}

export const LyricsTheme = {
  id: 0,
  title: 'lyrics',
  extends: 'lyrics',
  config: {
    backgroundColor: '#000000',
    foregroundColor: '#ffffff',
    title: {
      fontSize: 125,
      fontWeight: 700,
      transform: 'none',
      italic: false
    },
    artist: {
      fontSize: 75,
      fontWeight: 500,
      transform: 'none',
      italic: false
    },
    lyrics: {
      fontSize: 100,
      fontWeight: 500,
      transform: 'none',
      italic: false
    }
  } as ILyricsThemeConfig
} as ITheme;

export const SubtitlesTheme = {
  id: 0,
  title: 'subtitles',
  extends: 'subtitles',
  config: {
    backgroundColor: '#00ff00',
    foregroundColor: '#ffffff',
    title: {
      fontSize: 125,
      fontWeight: 700,
      transform: 'none',
      italic: false
    },
    artist: {
      fontSize: 75,
      fontWeight: 500,
      transform: 'none',
      italic: false
    },
    lyrics: {
      fontSize: 100,
      fontWeight: 500,
      transform: 'none',
      italic: false
    },
    position: 'bottom'
  } as ISubtitlesThemeConfig
} as ITheme;

export const TeleprompterTheme = {
  id: 0,
  title: 'teleprompter',
  extends: 'teleprompter',
  config: {
    backgroundColor: '#000000',
    foregroundColor: '#ffffff',
    title: {
      fontSize: 125,
      fontWeight: 700,
      transform: 'none',
      italic: false
    },
    artist: {
      fontSize: 75,
      fontWeight: 400,
      transform: 'none',
      italic: false
    },
    lyrics: {
      fontSize: 100,
      fontWeight: 400,
      transform: 'none',
      italic: false
    },
    chords: {
      color: '#ffdf20',
      fontSize: 100,
      fontWeight: 700,
      transform: 'none',
      italic: false
    },
    clock: {
      color: '#ffffff',
      fontSize: 100,
      fontWeight: 500,
      transform: 'none',
      italic: false
    }
  } as ITeleprompterThemeConfig
} as ITheme;
