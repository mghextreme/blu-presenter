import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { ITheme, LyricsTheme } from '@/types'

interface PreviewConfigState {
  previewTheme: ITheme
  previewRatio: string
  setPreviewTheme: (theme: ITheme) => void
  setPreviewRatio: (ratio: string) => void
}

export const usePreviewConfig = create<PreviewConfigState>()(
  persist(
    (set) => ({
      previewTheme: LyricsTheme,
      previewRatio: '16/9',
      setPreviewTheme: (theme: ITheme) => set({ previewTheme: theme }),
      setPreviewRatio: (ratio: string) => set({ previewRatio: ratio }),
    }),
    {
      name: 'previewConfig',
      partialize: (state: PreviewConfigState) => ({
        previewTheme: state.previewTheme,
        previewRatio: state.previewRatio,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
