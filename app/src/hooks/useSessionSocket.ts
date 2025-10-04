import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as config from '@/lib/config';

interface SessionSocketConfig {
  auth?: Record<string, any>;
  onConnect?: (socket: Socket) => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: any) => void;
  onJoinedSession?: (data: any) => void;
  onLeftSession?: (data: any) => void;
  additionalEvents?: {
    eventName: string;
    handler: (data: any) => void;
  }[];
}

interface JoinSessionParams {
  sessionId: number;
  secret: string;
  orgId: number | string;
  token?: string;
}

interface UseSessionSocketReturn {
  socket: Socket | null;
  connectedSessionId: number | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinSession: (params: JoinSessionParams) => void;
  leaveSession: (sessionId: number) => void;
  emit: (event: string, data: any) => void;
}

export function useSessionSocket(socketConfig: SessionSocketConfig): UseSessionSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connectedSessionId, setConnectedSessionId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const isSubscribedRef = useRef<boolean>(false);
  const configRef = useRef(socketConfig);

  // Keep config ref updated with latest callbacks
  useEffect(() => {
    configRef.current = socketConfig;
  }, [socketConfig]);

  const joinSession = useCallback((params: JoinSessionParams) => {
    if (!socketRef.current) {
      return;
    }

    if (!params.sessionId) {
      return;
    }

    socketRef.current.emit('joinSession', {
      sessionId: params.sessionId,
      secret: params.secret,
      orgId: params.orgId,
      token: params.token,
    });
  }, []);

  const leaveSession = useCallback((sessionId: number) => {
    if (!socketRef.current || !sessionId) return;

    socketRef.current.emit('leaveSession', {
      sessionId,
    });
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, data);
  }, []);

  const unsubscribe = (socket: Socket) => {
    if (!isSubscribedRef.current) return;

    socket.off('connect');
    socket.off('disconnect');
    socket.off('error');
    socket.off('joinedSession');
    socket.off('leftSession');

    if (configRef.current.additionalEvents) {
      configRef.current.additionalEvents.forEach(({ eventName }) => {
        socket.off(eventName);
      });
    }

    isSubscribedRef.current = false;
  };

  const subscribe = (socket: Socket) => {
    if (isSubscribedRef.current) return;

    socket.on('connect', () => {
      setIsConnected(true);
      configRef.current.onConnect?.(socket);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      setConnectedSessionId(null);
      configRef.current.onDisconnect?.(reason);
    });

    socket.on('error', (data) => {
      console.error('socketError', data);

      switch (data.code) {
        case 'unauthorized':
          setConnectedSessionId(null);
          break;

        case 'notInSession':
          setConnectedSessionId(null);
          break;
      }

      configRef.current.onError?.(data);
    });

    socket.on('joinedSession', (data) => {
      setConnectedSessionId(Number(data.id));
      configRef.current.onJoinedSession?.(data);
    });

    socket.on('leftSession', (data) => {
      if (connectedSessionId === data.id) {
        setConnectedSessionId(null);
      }
      configRef.current.onLeftSession?.(data);
    });

    if (configRef.current.additionalEvents) {
      configRef.current.additionalEvents.forEach(({ eventName, handler }) => {
        socket.on(eventName, handler);
      });
    }

    isSubscribedRef.current = true;
  };

  const ensureSocket = () => {
    if (socketRef.current) return socketRef.current;

    const newSocket = io(config.api.url, {
      autoConnect: false,
      auth: configRef.current.auth || {},
      path: '/socket/sessions',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = newSocket;
    subscribe(newSocket);

    return newSocket;
  };

  const connect = useCallback(() => {
    const socket = ensureSocket();
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (!socketRef.current) return;

    if (connectedSessionId) {
      leaveSession(connectedSessionId);
      setConnectedSessionId(null);
    }

    unsubscribe(socketRef.current);
    socketRef.current.disconnect();
    socketRef.current = null;
    setIsConnected(false);
  }, [connectedSessionId, leaveSession]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    connectedSessionId,
    isConnected,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    emit,
  };
}

