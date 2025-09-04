import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type SystemTheme = "dark" | "light";
type Theme = SystemTheme | "system";

interface ThemeState {
  theme: Theme
  systemTheme: SystemTheme
  setTheme: (to: Theme) => void
  setSystemTheme: (to: SystemTheme) => void
}

const updateDocument = (theme: Theme) => {
  const root = window.document.documentElement;

  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";

    root.classList.add(systemTheme);
    useTheme.getState().setSystemTheme(systemTheme);
    return;
  }

  root.classList.add(theme);
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      systemTheme: 'light',
      setTheme: (to: Theme) => {
        updateDocument(to);
        return set({ theme: to });
      },
      setSystemTheme: (to: SystemTheme) => {
        return set({ systemTheme: to });
      },
    }),
    {
      name: "theme",
      partialize: (state: ThemeState) => ({
        theme: state.theme,
        systemTheme: state.systemTheme,
      }),
      onRehydrateStorage: () => ((state?: ThemeState) => {
        if (!state) return;

        updateDocument(state.theme);
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
