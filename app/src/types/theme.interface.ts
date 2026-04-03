export const BASE_THEME_TYPES = ['lyrics', 'subtitles', 'teleprompter'] as const;
export type BaseTheme = typeof BASE_THEME_TYPES[number];

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
  comments: IFontConfig & { color: string, enabled: boolean }
}

export interface ITheme {
  id: number
  name: string
  extends: BaseTheme
  config?: ILyricsThemeConfig | ISubtitlesThemeConfig | ITeleprompterThemeConfig
  organization?: {
    id: number
    name: string
  }
}
