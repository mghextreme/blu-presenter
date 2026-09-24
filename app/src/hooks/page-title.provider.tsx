import { createContext, useMemo, useState } from "react"

type PageTitleProviderProps = {
  children: React.ReactNode
}

type PageTitleProviderState = {
  title: string | null,
  setTitle: (title: string | null) => void,
}

const initialState: PageTitleProviderState = {
  title: null,
  setTitle: () => null,
}

export const PageTitleProviderContext = createContext<PageTitleProviderState>(initialState);

export function PageTitleProvider({ children }: PageTitleProviderProps) {
  const [title, setTitle] = useState<string | null>(initialState.title);

  const value = useMemo(() => {
    return { title, setTitle } as PageTitleProviderState;
  }, [title]);

  return (
    <PageTitleProviderContext.Provider value={value}>
      {children}
    </PageTitleProviderContext.Provider>
  )
}
