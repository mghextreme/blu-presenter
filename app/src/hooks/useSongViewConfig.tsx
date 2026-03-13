import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type SongViewMode = 'lyrics' | 'chords';

interface SongViewConfigState {
  viewMode: SongViewMode
  setViewMode: (mode: SongViewMode) => void
  toggleViewMode: () => void
}

export const useSongViewConfig = create<SongViewConfigState>()(
  persist(
    (set, get) => ({
      viewMode: 'lyrics',
      setViewMode: (mode: SongViewMode) => {
        return set({ viewMode: mode });
      },
      toggleViewMode: () => {
        const current = get().viewMode;
        return set({ viewMode: current === 'lyrics' ? 'chords' : 'lyrics' });
      },
    }),
    {
      name: "songViewConfig",
      partialize: (state: SongViewConfigState) => ({
        viewMode: state.viewMode,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
