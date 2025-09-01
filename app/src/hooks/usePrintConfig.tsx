import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface PrintConfigState {
  fontSize: number
  increateFontSize: () => void
  decreateFontSize: () => void
  resetFontSize: () => void
  showChords: boolean
  toggleChords: () => void
  showNumbers: boolean
  toggleNumbers: () => void
  compactMode: boolean
  toggleCompactMode: () => void
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
      showChords: true,
      toggleChords: () => {
        return set({ showChords: !get().showChords });
      },
      showNumbers: true,
      toggleNumbers: () => {
        return set({ showNumbers: !get().showNumbers });
      },
      compactMode: true,
      toggleCompactMode: () => {
        return set({ compactMode: !get().compactMode });
      },
    }),
    {
      name: "printConfig",
      partialize: (state: PrintConfigState) => ({
        fontSize: state.fontSize,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
