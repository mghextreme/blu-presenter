import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { io, Socket } from "socket.io-client"
import * as config from '@/lib/config';
import { BaseTheme, IBroadcastSession } from "@/types"
import { useAuth } from "./useAuth"
import { useController } from "./controller.provider"

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

const BroadcastProviderContext = createContext<BroadcastProviderState>(initialState);

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

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectedSessionId, setConnectedSessionId] = useState<number | null>(null);
  const [session, setSession] = useState<IBroadcastSession | undefined>(initialState.session);

  const ensureSocket = () => {
    if (socket) return socket;

    const newSocket = io(config.api.url, {
      autoConnect: false,
      auth: {
        token: authSession?.access_token,
      },
      path: '/socket/sessions',
    });

    setSocket(newSocket);
    return newSocket;
  };

  const subscribe = (curSocket: Socket) => {
    curSocket?.on('error', (data) => {
      console.error('socketError', data);

      switch (data.code) {
        case 'unauthorized':
          disconnect();
          setConnectedSessionId(null);
          break;

        case 'notInSession':
          setConnectedSessionId(null);
          break
      }
    });

    curSocket?.on('joinedSession', (data) => {
      setConnectedSessionId(data.id);

      curSocket?.emit('setSchedule', {
        sessionId: data.id,
        schedule: schedule ?? [],
      });

      curSocket?.emit('setScheduleItem', {
        sessionId: data.id,
        scheduleItem: scheduleItem ?? {},
      });

      curSocket?.emit('setSelection', {
        sessionId: data.id,
        selection: selection ?? {},
      });
    });

    curSocket?.on('leftSession', (data) => {
      if (connectedSessionId === data.id) {
        setConnectedSessionId(null);
      }
    });

    curSocket?.on('connected', (data) => {
      // No action
    });

    curSocket?.on('disconnected', (data) => {
      // No action
    });
  };

  const ensureConnection = (toSession?: IBroadcastSession) => {
    const curSocket = ensureSocket();

    if (!curSocket.connected) {
      curSocket.connect();
      subscribe(curSocket);
      setSocket(curSocket);
    }

    if (!toSession) {
      toSession = session;
    }

    if (!connectedSessionId && !!toSession && !!toSession?.id) {
      curSocket.emit('joinSession', {
        sessionId: toSession.id,
        secret: toSession.secret,
        orgId: toSession.orgId,
        token: authSession?.access_token,
      });
    }

    return curSocket;
  }

  const updateConnectedSession = (toSession?: IBroadcastSession) => {
    if (toSession?.id === connectedSessionId) return;

    if (!!connectedSessionId) {
      ensureSocket()?.emit('leaveSession', {
        sessionId: connectedSessionId,
      });
    }

    if (toSession?.id) {
      ensureConnection(toSession)?.emit('joinSession', {
        sessionId: toSession?.id,
        secret: toSession?.secret,
        orgId: toSession?.orgId,
        token: authSession?.access_token,
      });
    }
  }

  const disconnect = () => {
    if (!socket) return;

    if (connectedSessionId) {
      socket.emit('leaveSession', {
        sessionId: connectedSessionId,
      });
      setConnectedSessionId(null);
    }

    socket.disconnect();
  }

  useEffect(() => {
    ensureSocket();

    return () => {
      disconnect();
    };
  }, []);

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
    if (!session) return;

    const curSocket = ensureConnection();
    curSocket.emit('setSchedule', {
      sessionId: connectedSessionId,
      schedule,
    });
  }, [schedule]);

  useEffect(() => {
    if (!session) return;

    const curSocket = ensureConnection();
    curSocket.emit('setScheduleItem', {
      sessionId: connectedSessionId,
      scheduleItem
    });
  }, [scheduleItem]);

  useEffect(() => {
    if (!session) return;

    const curSocket = ensureConnection();
    curSocket.emit('setSelection', {
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

export const useBroadcast = () => {
  const context = useContext(BroadcastProviderContext)

  if (context === undefined)
    throw new Error("useBroadcast must be used within a BroadcastProvider")

  return context
}
