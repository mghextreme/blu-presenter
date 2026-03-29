import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface LineStyle {
  enabled: boolean
  color?: string
  bold: boolean
  italic: boolean
}

interface PrintConfigState {
  fontSize: number
  increateFontSize: () => void
  decreateFontSize: () => void
  resetFontSize: () => void
  showNumbers: boolean
  toggleNumbers: () => void
  columns: number
  toggleColumns: () => void
  showSpotifyCode: boolean
  toggleSpotifyCode: () => void
  compactMode?: 'compact' | 'firstLine'
  setCompactMode: (mode: 'compact' | 'firstLine' | undefined) => void
  chordsStyle: LineStyle
  setChordsStyle: (style: Partial<LineStyle>) => void
  commentsStyle: LineStyle
  setCommentsStyle: (style: Partial<LineStyle>) => void
}

export const usePrintConfig = create<PrintConfigState>()(
  persist(
    (set, get) => ({
      fontSize: 16,
      increateFontSize: () => {
        const cur = get().fontSize;
        return set({ fontSize: cur + 1 });
      },
      decreateFontSize: () => {
        const cur = get().fontSize;
        if (cur <= 2) return;
        return set({ fontSize: cur - 1 });
      },
      resetFontSize: () => {
        return set({ fontSize: 16 });
      },
      showNumbers: true,
      toggleNumbers: () => {
        return set({ showNumbers: !get().showNumbers });
      },
      columns: 1,
      toggleColumns: () => {
        const cur = get().columns;
        if (cur == 1) {
          return set({ columns: 2 });
        } else {
          return set({ columns: 1 });
        }
      },
      compactMode: 'compact',
      setCompactMode: (mode) => {
        return set({ compactMode: mode });
      },
      showSpotifyCode: true,
      toggleSpotifyCode: () => {
        return set({ showSpotifyCode: !get().showSpotifyCode });
      },
      chordsStyle: {
        enabled: true,
        bold: true,
        italic: false,
      },
      setChordsStyle: (style) => {
        return set({ chordsStyle: { ...get().chordsStyle, ...style } });
      },
      commentsStyle: {
        enabled: true,
        color: '#777',
        bold: false,
        italic: true,
      },
      setCommentsStyle: (style) => {
        return set({ commentsStyle: { ...get().commentsStyle, ...style } });
      },
    }),
    {
      name: "printConfig",
      partialize: (state: PrintConfigState) => ({
        fontSize: state.fontSize,
        showNumbers: state.showNumbers,
        compactMode: state.compactMode,
        columns: state.columns,
        showSpotifyCode: state.showSpotifyCode,
        chordsStyle: state.chordsStyle,
        commentsStyle: state.commentsStyle,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
