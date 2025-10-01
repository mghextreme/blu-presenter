"use client"

import { useEffect, useRef, useState } from "react";
import { useLoaderData, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import * as config from '@/lib/config';
import { IControllerSelection, IScheduleItem, ISession, ITheme, LyricsTheme, SubtitlesTheme, TeleprompterTheme } from "@/types";
import { useController } from "@/hooks/controller.provider";
import SelectorScreen from "@/components/controller/selector-screen";

export default function Receiver() {

  const params = useParams();

  const {
    replaceSchedule,
    setScheduleItem,
    setSelection,
    setMode,
  } = useController();

  const {
    session,
    themes,
  } = useLoaderData() as {
    session: ISession,
    themes: ITheme[],
  };

  useEffect(() => {
    replaceSchedule(session?.schedule ? session.schedule as IScheduleItem[] : []);
    setScheduleItem(session?.scheduleItem ?? {} as IScheduleItem);
    setSelection(session?.selection ?? {} as IControllerSelection);
  }, []);

  const socketRef = useRef<Socket | null>(null);
  const connectionSubscribed = useRef<boolean>(false);
  const connectedSessionId = useRef<number | null>(null);

  const ensureSocket = () => {
    if (socketRef.current) return socketRef.current;

    const newSocket = io(config.api.url, {
      autoConnect: true,
      auth: {
        orgId: Number(params.orgId),
        sessionId: Number(params.sessionId),
        secret: params.secret,
      },
      path: '/socket/sessions',
    });

    return newSocket;
  };

  const subscribe = (curSocket: Socket) => {
    if (connectionSubscribed.current) return;

    curSocket?.on('error', (data) => {
      console.error('socketError', data);

      switch (data.code) {
        case 'unauthorized':
          disconnect();
          connectedSessionId.current = null;
          break;

        case 'notInSession':
          connectedSessionId.current = null;
          break
      }
    });

    curSocket?.on('joinedSession', (data) => {
      connectedSessionId.current = Number(data.id);

      if (data.schedule) {
        replaceSchedule(data.schedule as IScheduleItem[]);
      }

      if (data.scheduleItem) {
        setScheduleItem(data.scheduleItem as IScheduleItem);
      }

      if (data.selection) {
        setSelection(data.selection as IControllerSelection);
      }
    });

    curSocket?.on('leftSession', (data) => {
      if (connectedSessionId.current === data.id) {
        connectedSessionId.current = null;
      }
    });

    curSocket?.on('connected', (data) => {
      // No action
    });

    curSocket?.on('disconnected', (data) => {
      // No action
    });

    curSocket?.on('schedule', (data) => {
      try {
        replaceSchedule(data as IScheduleItem[]);
      } catch (e) {
        console.error(e);
      }
    });

    curSocket?.on('scheduleItem', (data) => {
      try {
        setScheduleItem(data as IScheduleItem);
      } catch (e) {
        console.error(e);
      }
    });

    curSocket?.on('selection', (data) => {
      try {
        setSelection(data as IControllerSelection);
      } catch (e) {
        console.error(e);
      }
    });

    connectionSubscribed.current = true;
  };

  const ensureConnection = () => {
    const curSocket = ensureSocket();

    if (!curSocket.connected) {
      curSocket.connect();
      subscribe(curSocket);
      socketRef.current = curSocket;
    }

    if (!connectedSessionId.current && !!session && !!session?.id) {
      curSocket.emit('joinSession', {
        sessionId: session.id,
        secret: session.secret,
        orgId: params.orgId,
      });
    }

    return curSocket;
  }

  const disconnect = () => {
    if (!socketRef.current) return;

    if (!!connectedSessionId.current) {
      socketRef.current.emit('leaveSession', {
        sessionId: connectedSessionId.current,
      });
      connectedSessionId.current = null;
    }

    socketRef.current.disconnect();
  }

  useEffect(() => {
    ensureConnection();

    const healthCheckInterval = setInterval(ensureConnection, 10000);

    return () => {
      clearInterval(healthCheckInterval);
      disconnect();
    };
  }, []);

  console.log('themes', themes);

  const [selectedTheme, setSelectedTheme] = useState<ITheme | undefined>(undefined);
  useEffect(() => {
    if (!params.theme) return;

    switch (params.theme) {
      case 'lyrics':
        setSelectedTheme(LyricsTheme);
        break;
      case 'subtitles':
        setSelectedTheme(SubtitlesTheme);
        break;
      case 'teleprompter':
        setSelectedTheme(TeleprompterTheme);
        break;
      default:
        try {
          const themeId = Number(params.theme);
          const curTheme = themes.find((theme) => theme.id === themeId);
          if (curTheme) {
            setSelectedTheme(curTheme);
          }
        } catch (e) {
          console.warn(e);
        }
        break;
    }
  }, [themes]);

  return (
    <>
      <div id="receiver" className="flex-1 h-full">
        <style>
          html, body {'{'}
            background-color: transparent;
          {'}'}
        </style>
        <SelectorScreen setMode={setMode} themeOptions={selectedTheme ? [] : themes} defaultTheme={selectedTheme}></SelectorScreen>
      </div>
    </>
  );
}
