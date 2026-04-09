import { createContext, useEffect, useMemo, useRef, useState } from "react"
import { BaseTheme, IBroadcastSession } from "@/types"
import { useAuth } from "./useAuth"
import { useController } from "./useController"
import { useSessionSocket } from "./useSessionSocket"

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

  const {
    schedule,
    scheduleItem,
    selection,
  } = useController();

  const [session, setSession] = useState<IBroadcastSession | undefined>(() => {
    try {
      const saved = sessionStorage.getItem('broadcastSession');
      return saved ? (JSON.parse(saved) as IBroadcastSession) : undefined;
    } catch {
      return undefined;
    }
  });

  // Ref to always have the latest session value in callbacks (avoids stale closures)
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Local ref mirroring connectedSessionId to avoid stale closures in updateConnectedSession
  const connectedSessionIdRef = useRef<number | null>(null);

  const {
    connectedSessionId,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    emit
  } = useSessionSocket({
    auth: {
      token: authSession?.access_token,
    },
    onConnect: () => {
      // Handle reconnection: if the socket reconnects after a drop,
      // rejoin the session. Skip if already in a session (connectedSessionIdRef
      // is set), since the initial join is handled by updateConnectedSession.
      if (connectedSessionIdRef.current) return;

      const s = sessionRef.current;
      if (s?.id && s.secret && s.orgId) {
        joinSession({
          sessionId: s.id,
          secret: s.secret,
          orgId: s.orgId,
          token: authSession?.access_token,
        });
      }
    },
    onJoinedSession: (data) => {
      emit('setSchedule', {
        sessionId: data.id,
        schedule: schedule ?? [],
      });

      if (scheduleItem) {
        emit('setScheduleItem', {
          sessionId: data.id,
          scheduleItem: scheduleItem,
        });

        if (selection) {
          emit('setSelection', {
            sessionId: data.id,
            selection: selection,
          });
        }
      }
    },
    onError: (data) => {
      const s = sessionRef.current;
      if (data.code === 'notInSession' && s?.id && s.secret && s.orgId) {
        joinSession({
          sessionId: s.id,
          secret: s.secret,
          orgId: s.orgId,
          token: authSession?.access_token,
        });
      }
    },
  });

  // Keep local ref in sync with connectedSessionId state from the socket hook
  useEffect(() => {
    connectedSessionIdRef.current = connectedSessionId;
  }, [connectedSessionId]);

  const updateConnectedSession = (toSession?: IBroadcastSession) => {
    if (!toSession?.id) {
      disconnect();
      return;
    }

    if (toSession.id === connectedSessionIdRef.current) return;

    if (connectedSessionIdRef.current) {
      leaveSession(connectedSessionIdRef.current);
    }

    if (toSession.secret && toSession.orgId) {
      // Ensure the socket is created and connecting/connected.
      // If already connected, connect() is a no-op.
      // Then emit joinSession — if the socket is still connecting,
      // socket.io will buffer the emit and send it once connected.
      connect();
      joinSession({
        sessionId: toSession.id,
        secret: toSession.secret,
        orgId: toSession.orgId,
        token: authSession?.access_token,
      });
    }
  };

  // On mount, connect to the session restored from sessionStorage
  useEffect(() => {
    if (session) {
      updateConnectedSession(session);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const externalSetSession = (newBroadcastSession?: IBroadcastSession) => {
    if (!newBroadcastSession) {
      sessionStorage.removeItem('broadcastSession');
    } else {
      sessionStorage.setItem('broadcastSession', JSON.stringify(newBroadcastSession));
    }

    // Update the ref immediately so onConnect sees the new session
    sessionRef.current = newBroadcastSession;
    setSession(newBroadcastSession);
    updateConnectedSession(newBroadcastSession);
  }

  useEffect(() => {
    if (!session || !connectedSessionId) return;

    emit('setSchedule', {
      sessionId: connectedSessionId,
      schedule,
    });
  }, [schedule]);

  useEffect(() => {
    if (!session || !connectedSessionId) return;

    emit('setScheduleItem', {
      sessionId: connectedSessionId,
      scheduleItem
    });
  }, [scheduleItem]);

  useEffect(() => {
    if (!session || !connectedSessionId) return;

    emit('setSelection', {
      sessionId: connectedSessionId,
      selection,
    });
  }, [selection]);

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
