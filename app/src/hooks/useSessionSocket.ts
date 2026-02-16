import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as config from '@/lib/config';

interface SessionSocketConfig {
  auth?: Record<string, any>;
  onConnect?: (socket: Socket) => void;
  onDisconnect?: (reason: string) => void;
  onReconnect?: (attemptNumber: number) => void;
  onReconnectAttempt?: (attemptNumber: number) => void;
  onConnectError?: (error: Error) => void;
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
  reconnectAttempts: number;
  connect: () => void;
  disconnect: () => void;
  joinSession: (params: JoinSessionParams) => void;
  leaveSession: (sessionId: number) => void;
  emit: (event: string, data: any) => void;
}

export function useSessionSocket(socketConfig: SessionSocketConfig): UseSessionSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connectedSessionId, setConnectedSessionId] = useState<number | null>(null);
  const connectedSessionIdRef = useRef<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const isSubscribedRef = useRef<boolean>(false);
  const configRef = useRef(socketConfig);

  // Keep config ref updated with latest callbacks
  useEffect(() => {
    configRef.current = socketConfig;
  }, [socketConfig]);

  // Helper to update connectedSessionId in both state and ref
  const updateConnectedSessionId = useCallback((id: number | null) => {
    connectedSessionIdRef.current = id;
    setConnectedSessionId(id);
  }, []);

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

    // Reconnection events (from the Manager)
    socket.io.off('reconnect');
    socket.io.off('reconnect_attempt');
    socket.io.off('error');

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
      setReconnectAttempts(0);
      configRef.current.onConnect?.(socket);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      updateConnectedSessionId(null);
      configRef.current.onDisconnect?.(reason);
    });

    socket.on('error', (data) => {
      console.error('socketError', data);

      switch (data.code) {
        case 'unauthorized':
          updateConnectedSessionId(null);
          break;

        case 'notInSession':
          updateConnectedSessionId(null);
          break;
      }

      configRef.current.onError?.(data);
    });

    socket.on('joinedSession', (data) => {
      updateConnectedSessionId(Number(data.id));
      configRef.current.onJoinedSession?.(data);
    });

    socket.on('leftSession', (data) => {
      if (connectedSessionIdRef.current === data.id) {
        updateConnectedSessionId(null);
      }
      configRef.current.onLeftSession?.(data);
    });

    // Reconnection events live on the Manager (socket.io), not the Socket
    socket.io.on('reconnect', (attemptNumber: number) => {
      setReconnectAttempts(0);
      configRef.current.onReconnect?.(attemptNumber);
    });

    socket.io.on('reconnect_attempt', (attemptNumber: number) => {
      setReconnectAttempts(attemptNumber);
      configRef.current.onReconnectAttempt?.(attemptNumber);
    });

    socket.io.on('error', (error: Error) => {
      configRef.current.onConnectError?.(error);
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

    const currentSessionId = connectedSessionIdRef.current;
    if (currentSessionId) {
      leaveSession(currentSessionId);
      updateConnectedSessionId(null);
    }

    unsubscribe(socketRef.current);
    socketRef.current.disconnect();
    socketRef.current = null;
    setIsConnected(false);
  }, [leaveSession, updateConnectedSessionId]);

  useEffect(() => {
    return () => {
      // Use ref-based cleanup so it always has the current socket
      if (!socketRef.current) return;

      const currentSessionId = connectedSessionIdRef.current;
      if (currentSessionId) {
        socketRef.current.emit('leaveSession', { sessionId: currentSessionId });
      }

      if (isSubscribedRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('error');
        socketRef.current.off('joinedSession');
        socketRef.current.off('leftSession');
        socketRef.current.io.off('reconnect');
        socketRef.current.io.off('reconnect_attempt');
        socketRef.current.io.off('error');
        isSubscribedRef.current = false;
      }

      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    socket: socketRef.current,
    connectedSessionId,
    isConnected,
    reconnectAttempts,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    emit,
  };
}
