import { createContext, useEffect, useMemo, useState } from "react"
import { BaseTheme, IBroadcastSession } from "@/types"
import { useAuth } from "./useAuth"
import { useController } from "./useController"
import { useServices } from "./useServices"
import { useSessionSocket, JoinSessionParams } from "./useSessionSocket"
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

export function BroadcastProvider({
  children,
  ...props
}: BroadcastProviderProps) {

  const {
    session: authSession,
  } = useAuth();

  const { broadcastService } = useServices();

  const {
    schedule,
    scheduleItem,
    selection,
  } = useController();

  const [session, setSession] = useState<IBroadcastSession | undefined>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.broadcastSession);
      return saved ? (JSON.parse(saved) as IBroadcastSession) : undefined;
    } catch {
      return undefined;
    }
  });

  const {
    switchSession
  } = useSessionSocket({
    auth: {
      token: authSession?.access_token,
    },
    // Values used in onJoinedSession are always fresh because useSessionSocket
    // calls callbacks via configRef, which is kept in sync every render.
    onJoinedSession: (data) => {
      // Push the controller's full state after every (re)join. This seeds
      // listeners on session switch and re-syncs them after a reconnect.
      broadcastState(data.id);
    },
  });

  /**
   * Push the controller's current state to the session via the REST write
   * path. Each call carries the current access token (auto-refreshed on
   * 401 by ApiService) — failures are logged instead of silently dropped.
   */
  const broadcastState = (sessionId: number) => {
    const orgId = session?.orgId;
    if (!orgId) return;

    broadcastService.setSchedule(sessionId, orgId, schedule ?? [])
      .catch((e) => console.warn('Failed to broadcast schedule:', e));

    if (!scheduleItem) return;

    broadcastService.setScheduleItem(sessionId, orgId, scheduleItem)
      .catch((e) => console.warn('Failed to broadcast schedule item:', e));

    if (!selection) return;

    broadcastService.setSelection(sessionId, orgId, selection)
      .catch((e) => console.warn('Failed to broadcast selection:', e));
  };

  const toJoinParams = (s?: IBroadcastSession): JoinSessionParams | null => {
    if (s?.id && s.secret && s.orgId) {
      return {
        sessionId: s.id,
        secret: s.secret,
        orgId: s.orgId,
        token: authSession?.access_token,
      };
    }
    return null;
  };

  // On mount, connect to the session restored from sessionStorage
  useEffect(() => {
    const params = toJoinParams(session);
    if (params) {
      switchSession(params);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const externalSetSession = (newBroadcastSession?: IBroadcastSession) => {
    if (!newBroadcastSession) {
      sessionStorage.removeItem(STORAGE_KEYS.broadcastSession);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.broadcastSession, JSON.stringify(newBroadcastSession));
    }

    setSession(newBroadcastSession);

    const params = toJoinParams(newBroadcastSession);
    switchSession(params);
  }

  useEffect(() => {
    if (!session?.id || !session?.orgId) return;

    broadcastService.setSchedule(session.id, session.orgId, schedule)
      .catch((e) => console.warn('Failed to broadcast schedule:', e));
  }, [broadcastService, schedule, session]);

  useEffect(() => {
    if (!session?.id || !session?.orgId) return;

    broadcastService.setScheduleItem(session.id, session.orgId, scheduleItem)
      .catch((e) => console.warn('Failed to broadcast schedule item:', e));
  }, [broadcastService, scheduleItem, session]);

  useEffect(() => {
    if (!session?.id || !session?.orgId) return;

    broadcastService.setSelection(session.id, session.orgId, selection)
      .catch((e) => console.warn('Failed to broadcast selection:', e));
  }, [broadcastService, selection, session]);

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
