import { createContext, useEffect, useMemo, useState } from "react"
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

export default function BroadcastProvider({
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

  const [session, setSession] = useState<IBroadcastSession | undefined>(initialState.session);

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
      if (session?.id && session.secret && session.orgId) {
        joinSession({
          sessionId: session.id,
          secret: session.secret,
          orgId: session.orgId,
          token: authSession?.access_token,
        });
      }
    },
    onJoinedSession: (data) => {
      emit('setSchedule', {
        sessionId: data.id,
        schedule: schedule ?? [],
      });

      emit('setScheduleItem', {
        sessionId: data.id,
        scheduleItem: scheduleItem ?? {},
      });

      emit('setSelection', {
        sessionId: data.id,
        selection: selection ?? {},
      });
    },
    onError: (data) => {
      if (data.code === 'notInSession' && session?.id && session.secret && session.orgId) {
        joinSession({
          sessionId: session.id,
          secret: session.secret,
          orgId: session.orgId,
          token: authSession?.access_token,
        });
      }
    },
  });

  const updateConnectedSession = (toSession?: IBroadcastSession) => {
    if (!toSession?.id) {
      disconnect();
      return;
    }

    if (toSession.id === connectedSessionId) return;

    if (connectedSessionId) {
      leaveSession(connectedSessionId);
    }

    if (toSession.secret && toSession.orgId) {
      connect();
      joinSession({
        sessionId: toSession.id,
        secret: toSession.secret,
        orgId: toSession.orgId,
        token: authSession?.access_token,
      });
    }
  };

  try {
    const savedBroadcastSession = sessionStorage.getItem('broadcastSession');
    if (savedBroadcastSession) {
      initialState.session = (JSON.parse(savedBroadcastSession) as IBroadcastSession) || initialState.session;
    }
  }
  catch (e) {
    // Ignore error
  }

  const externalSetSession = (newBroadcastSession?: IBroadcastSession) => {
    if (!newBroadcastSession) {
      sessionStorage.removeItem('broadcastSession');
    } else {
      sessionStorage.setItem('broadcastSession', JSON.stringify(newBroadcastSession));
    }

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
