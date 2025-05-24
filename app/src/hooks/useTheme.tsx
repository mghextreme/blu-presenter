import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme
  setTheme: (to: Theme) => void
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
    return;
  }

  root.classList.add(theme);
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (to: Theme) => {
        updateDocument(to);
        return set({ theme: to });
      },
    }),
    {
      name: "theme",
      // getStorage: () => localStorage,
      partialize: (state: ThemeState) => ({
        theme: state.theme,
      }),
      onRehydrateStorage: () => ((state?: ThemeState) => {
        if (!state) return;

        updateDocument(state.theme);
      }),
      //@ts-expect-error // Mesma situação do useAuth.tsx
      storage: localStorage,
    }
  )
);
