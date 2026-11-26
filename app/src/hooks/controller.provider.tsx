import { useState } from "react"
import { useHotkeys } from 'react-hotkeys-hook';

import { SelectorScreen } from "@/components/controller/selector-screen"
import { WindowProvider } from "./window.provider"
import { ControllerStoreContext } from "./controller.context"
import { createControllerStore } from "./controller.store"
import { useController } from "./useController"

type ControllerProviderProps = {
  /** Persist schedule and config to browser storage (only the live controller does). */
  storeState?: boolean
  children: React.ReactNode
}

/** Each provider owns an independent controller store. */
export function ControllerProvider({ storeState = false, children }: Readonly<ControllerProviderProps>) {
  const [store] = useState(() => createControllerStore({ persist: storeState }));

  return (
    <ControllerStoreContext.Provider value={store}>
      {children}
      <ControllerHotkeys />
      <ProjectorWindows />
    </ControllerStoreContext.Provider>
  )
}

function ControllerHotkeys() {
  const { previous, next, previousItem, nextItem, toggleBlank } = useController((s) => ({
    previous: s.previous,
    next: s.next,
    previousItem: s.previousItem,
    nextItem: s.nextItem,
    toggleBlank: s.toggleBlank,
  }));

  // preventDefault stops the browser from scrolling the panels; they scroll to the selection instead.
  const options = { preventDefault: true };
  useHotkeys('ArrowLeft', previous, options);
  useHotkeys('PageUp', previous, options);
  useHotkeys('ArrowRight', next, options);
  useHotkeys('PageDown', next, options);
  useHotkeys('Control+ArrowLeft', () => previousItem(), options);
  useHotkeys('Control+PageUp', () => previousItem(), options);
  useHotkeys('Control+ArrowRight', nextItem, options);
  useHotkeys('Control+PageDown', nextItem, options);
  useHotkeys('Control+B', toggleBlank, options);

  return null;
}

function ProjectorWindows() {
  const { windows, closeWindow, setWindowTheme, setMode } = useController((s) => ({
    windows: s.windows,
    closeWindow: s.closeWindow,
    setWindowTheme: s.setWindowTheme,
    setMode: s.setMode,
  }));

  return windows.map((w) => (
    <WindowProvider key={w.id} id={w.id} onClose={() => closeWindow(w.id)}>
      <SelectorScreen
        setMode={setMode}
        onThemeChange={(theme) => setWindowTheme(w.id, theme)}
      />
    </WindowProvider>
  ));
}
