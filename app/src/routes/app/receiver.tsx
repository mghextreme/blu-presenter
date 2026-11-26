"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import { useLoaderData, useParams } from "react-router-dom";
import { IControllerSelection, IScheduleItem, ISession, ITheme, LyricsTheme, SubtitlesTheme, TeleprompterTheme } from "@/types";
import { useController } from "@/hooks/useController";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import { SelectorScreen } from "@/components/controller/selector-screen";
import { ConnectionIndicator } from "@/components/receiver/connection-indicator";
import i18next from "i18next";

const SYNC_INTERVAL_MS = 60_000; // Re-sync state every 60 seconds

export function Receiver() {

  const params = useParams();

  const { schedule, scheduleItem, replaceSchedule, setScheduleItem, setSelection, setMode } = useController((s) => ({
    schedule: s.schedule,
    scheduleItem: s.scheduleItem,
    replaceSchedule: s.replaceSchedule,
    setScheduleItem: s.setScheduleItem,
    setSelection: s.setSelection,
    setMode: s.setMode,
  }));

  const {
    session,
    themes,
  } = useLoaderData() as {
    session: ISession,
    themes: ITheme[],
  };

  // The provider's setters resolve against committed state, so a selection
  // that arrives together with a new schedule/schedule item must be applied
  // once that state has been committed — never in the same batch. Applying
  // both in one batch makes externalSetSelection return early on a missing
  // schedule item and externalSetScheduleItem reset the part to 0. Such a
  // selection is queued with the schedule/item references of that moment and
  // flushed as soon as either committed reference differs.
  const pendingSelection = useRef<{
    selection: IControllerSelection;
    schedule: IScheduleItem[];
    scheduleItem: IScheduleItem | undefined;
  } | undefined>(undefined);

  const applySelection = (
    selection: IControllerSelection | undefined,
    waitForCommit: boolean,
  ) => {
    // Any newer selection replaces one that is still waiting.
    pendingSelection.current = undefined;

    const hasSelection =
      !!selection &&
      (selection.scheduleItem !== undefined ||
        selection.slide !== undefined ||
        selection.part !== undefined);
    if (!hasSelection) return;

    if (waitForCommit) {
      pendingSelection.current = { selection, schedule, scheduleItem };
    } else {
      setSelection(selection);
    }
  };

  useEffect(() => {
    const pending = pendingSelection.current;
    if (!pending) return;
    if (pending.schedule === schedule && pending.scheduleItem === scheduleItem) return;

    pendingSelection.current = undefined;
    setSelection(pending.selection);
  }, [schedule, scheduleItem, setSelection]);

  useEffect(() => {
    replaceSchedule(session?.schedule ? session.schedule as IScheduleItem[] : []);
    setScheduleItem(session?.scheduleItem ?? {} as IScheduleItem);
    applySelection(session?.selection as IControllerSelection | undefined, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getJoinParams = useCallback(() => {
    if (session?.id && params.secret && params.orgId) {
      return {
        sessionId: session.id,
        secret: params.secret,
        orgId: params.orgId,
      };
    }
    return null;
  }, [session, params.secret, params.orgId]);

  const { connect, socket, isConnected, reconnectAttempts, joinSession } = useSessionSocket({
    auth: {
      orgId,
      sessionId,
      secret: params.secret,
    },
    onJoinedSession: (data) => {
      if (data.schedule) {
        replaceSchedule(data.schedule as IScheduleItem[]);
      }

      if (data.scheduleItem) {
        setScheduleItem(data.scheduleItem as IScheduleItem);
      }

      // Only wait for a commit when this push actually changed state;
      // otherwise nothing would ever flush the queued selection.
      applySelection(
        data.selection as IControllerSelection | undefined,
        !!data.schedule || !!data.scheduleItem,
      );
    },
    onError: (data) => {
      // Re-join session on notInSession error (e.g., server restart while transport survived)
      if (data.code === 'notInSession') {
        const joinParams = getJoinParams();
        if (joinParams) {
          joinSession(joinParams);
        }
      }
    },
    onConnectError: (error) => {
      console.warn('Socket connect error:', error.message);
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
            applySelection({
              scheduleItem: data.scheduleItem,
              slide: data.slide,
              part: data.part,
            } as IControllerSelection, false);
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

    const joinParams = getJoinParams();
    if (joinParams) {
      joinSession(joinParams);
    }
  }, [isConnected, socket, session, params.orgId, joinSession, getJoinParams]);

  // Periodic state sync: re-join session to get fresh state from server
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      const joinParams = getJoinParams();
      if (joinParams) {
        joinSession(joinParams);
      }
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isConnected, joinSession, getJoinParams]);

  useEffect(() => {
    if (!session || !session.language) return;
    i18next.changeLanguage(session.language);
  }, [session]);

  const [selectedTheme, setSelectedTheme] = useState<ITheme | undefined>(undefined);
  useEffect(() => {
    if (!session?.theme && !params.theme) return;

    const toTheme = params.theme ?? session?.theme;

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
  }, [themes, session, params]);

  return (
    <>
      <div id="receiver" className="flex-1 h-full">
        <style>
          html, body {'{'}
            background-color: transparent;
          {'}'}
        </style>
        <SelectorScreen setMode={setMode} themeOptions={selectedTheme ? [] : themes} defaultTheme={selectedTheme}></SelectorScreen>
        <ConnectionIndicator isConnected={isConnected} reconnectAttempts={reconnectAttempts} />
      </div>
    </>
  );
}
