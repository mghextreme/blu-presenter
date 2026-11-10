import { createContext, useEffect, useMemo, useState } from "react"
import { BaseTheme, IBroadcastSession } from "@/types"
import { useController } from "./useController"
import { useServices } from "./useServices"
import { STORAGE_KEYS } from "@/lib/storage-keys"

type BroadcastProviderProps = {
  children: React.ReactNode
}

type BroadcastProviderState = {
  session?: IBroadcastSession,
  setSession: (session?: IBroadcastSession) => void,

  urlTheme?: {label: string; value: BaseTheme | number},
  setUrlTheme: (theme?: {label: string; value: BaseTheme | number}) => void,
}

const initialState: BroadcastProviderState = {
  session: undefined,
  setSession: () => null,

  urlTheme: undefined,
  setUrlTheme: () => null,
}

export const BroadcastProviderContext = createContext<BroadcastProviderState>(initialState);

/**
 * Drives the REST write path for live broadcast state (controller →
 * listeners). The controller itself holds no WebSocket connection: every
 * change is persisted through the API, and the API fans the state out to
 * the room — only receiver pages need a socket to receive it.
 */
export function BroadcastProvider({
  children,
  ...props
}: Readonly<BroadcastProviderProps>) {

  const {
    schedule,
    scheduleItem,
    selection,
  } = useController();

  const { broadcastService } = useServices();

  const [session, setSession] = useState<IBroadcastSession | undefined>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.broadcastSession);
      return saved ? (JSON.parse(saved) as IBroadcastSession) : undefined;
    } catch {
      return undefined;
    }
  });

  // Restoring state may be stale mid-session: initial controller state has
  // no schedule item and no selection at all, so those writes are skipped
  // here instead of clearing the live state that listeners still show. The
  // schedule is always pushed — it is the controller's source of truth and
  // was restored for storeState routes.
  useEffect(() => {
    if (!session?.id || !session?.orgId) return;

    broadcastService.setSchedule(session.id, session.orgId, schedule)
      .catch((e) => console.warn('Failed to broadcast schedule:', e));
  }, [broadcastService, schedule, session]);

  useEffect(() => {
    if (!session?.id || !session?.orgId) return;

    // Nothing selected yet: skip instead of clearing the live schedule item.
    if (!scheduleItem) return;

    broadcastService.setScheduleItem(session.id, session.orgId, scheduleItem)
      .catch((e) => console.warn('Failed to broadcast schedule item:', e));
  }, [broadcastService, scheduleItem, session]);

  useEffect(() => {
    if (!session?.id || !session?.orgId) return;

    // Initial controller state has no item/slide/part at all. Pushing that
    // would persist an empty selection and blank out part on every listener
    // until the presenter re-selects.
    if (selection.scheduleItem === undefined) return;

    broadcastService.setSelection(session.id, session.orgId, selection)
      .catch((e) => console.warn('Failed to broadcast selection:', e));
  }, [broadcastService, selection, session]);

  const externalSetSession = (newBroadcastSession?: IBroadcastSession) => {
    if (!newBroadcastSession) {
      sessionStorage.removeItem(STORAGE_KEYS.broadcastSession);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.broadcastSession, JSON.stringify(newBroadcastSession));
    }

    setSession(newBroadcastSession);
  }

  const [urlTheme, setUrlTheme] = useState<BaseTheme | number | undefined>(undefined);

  const value = useMemo(() => {
    return {
      session,
      setSession: externalSetSession,

      urlTheme,
      setUrlTheme,
    } as BroadcastProviderState;
  }, [
    session, urlTheme,
  ]);

  return (
    <BroadcastProviderContext.Provider {...props} value={value}>
      {children}
    </BroadcastProviderContext.Provider>
  )
}
