import { createContext, useEffect, useMemo, useState } from "react"
import { BaseTheme, IBroadcastSession } from "@/types"
import { useAuth } from "./useAuth"
import { useController } from "./useController"
import { useSessionSocket, JoinSessionParams } from "./useSessionSocket"

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

  const {
    connectedSessionId,
    switchSession,
    emit
  } = useSessionSocket({
    auth: {
      token: authSession?.access_token,
    },
    // Values used in onJoinedSession are always fresh because useSessionSocket
    // calls callbacks via configRef, which is kept in sync every render.
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
  });

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
      sessionStorage.removeItem('broadcastSession');
    } else {
      sessionStorage.setItem('broadcastSession', JSON.stringify(newBroadcastSession));
    }

    setSession(newBroadcastSession);

    const params = toJoinParams(newBroadcastSession);
    switchSession(params);
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
