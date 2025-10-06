import { ITheme, IWindow, LyricsTheme, SubtitlesTheme, TeleprompterTheme } from '@/types'

export const createMockWindow = (id: string, theme: ITheme): IWindow => ({
  id,
  theme,
})

export const mockWindows: IWindow[] = [
  createMockWindow('window-1', LyricsTheme),
  createMockWindow('window-2', SubtitlesTheme),
  createMockWindow('window-3', TeleprompterTheme),
]

