"use client"

import { useEffect, useState } from "react";
import { useLoaderData, useParams } from "react-router-dom";
import { IControllerSelection, IScheduleItem, ISession, ITheme, LyricsTheme, SubtitlesTheme, TeleprompterTheme } from "@/types";
import { useController } from "@/hooks/controller.provider";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import SelectorScreen from "@/components/controller/selector-screen";
import i18next from "i18next";

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

  const { connect, socket, isConnected, joinSession } = useSessionSocket({
    auth: {
      orgId: Number(params.orgId),
      sessionId: Number(params.sessionId),
      secret: params.secret,
    },
    onJoinedSession: (data) => {
      if (data.schedule) {
        replaceSchedule(data.schedule as IScheduleItem[]);
      }

      if (data.scheduleItem) {
        setScheduleItem(data.scheduleItem as IScheduleItem);
      }

      if (data.selection) {
        setSelection(data.selection as IControllerSelection);
      }
    },
    additionalEvents: [
      {
        eventName: 'schedule',
        handler: (data) => {
          try {
            replaceSchedule(data as IScheduleItem[]);
          } catch (e) {
            console.error(e);
          }
        },
      },
      {
        eventName: 'scheduleItem',
        handler: (data) => {
          try {
            setScheduleItem(data as IScheduleItem);
          } catch (e) {
            console.error(e);
          }
        },
      },
      {
        eventName: 'selection',
        handler: (data) => {
          try {
            setSelection({
              scheduleItem: data.scheduleItem,
              slide: data.slide,
              part: data.part,
            } as IControllerSelection);
          } catch (e) {
            console.error(e);
          }
        },
      },
    ],
  });

  // Connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Join session when connected or when session changes
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    if (!socket) {
      return;
    }

    if (session?.id && params.secret && params.orgId) {
      joinSession({
        sessionId: session.id,
        secret: params.secret,
        orgId: params.orgId,
      });
    }
  }, [isConnected, socket, session, params.orgId, joinSession]);

  useEffect(() => {
    if (!session || !session.language) return;
    i18next.changeLanguage(session.language);
  }, [session]);

  const [selectedTheme, setSelectedTheme] = useState<ITheme | undefined>(undefined);
  useEffect(() => {
    if (!session?.theme && !params.theme) return;

    const toTheme = session?.theme ?? params.theme;

    switch (toTheme) {
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
          const themeId = Number(toTheme);
          const curTheme = themes.find((theme) => theme.id === themeId);
          if (curTheme) {
            setSelectedTheme(curTheme);
          }
        } catch (e) {
          console.warn(e);
        }
        break;
    }
  }, [themes, session]);

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
