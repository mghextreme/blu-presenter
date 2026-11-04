import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { offlineDb } from "@/lib/offline/db";

/** Ids of songs currently downloaded for offline use. */
export function useDownloadedSongIds(): Set<number> {
  const ids = useLiveQuery(
    () => offlineDb.songs.toArray().then(rows => rows.map(row => row.id)),
    [],
    [] as number[],
  );
  return useMemo(() => new Set(ids), [ids]);
}

/** Ids of schedules currently downloaded for offline use. */
export function useDownloadedScheduleIds(): Set<number> {
  const ids = useLiveQuery(
    () => offlineDb.schedules.toArray().then(rows => rows.map(row => row.id)),
    [],
    [] as number[],
  );
  return useMemo(() => new Set(ids), [ids]);
}

export type OfflineSummary = {
  songCount: number;
  scheduleCount: number;
  themeCount: number;
  /** ISO timestamp of the most recent successful sync of any row, if any. */
  lastSyncedAt?: string;
};

export function useOfflineSummary(): OfflineSummary | undefined {
  return useLiveQuery(async () => {
    const [songs, schedules, themes] = await Promise.all([
      offlineDb.songs.toArray(),
      offlineDb.schedules.toArray(),
      offlineDb.themes.toArray(),
    ]);
    const lastSyncedAt = [...songs, ...schedules, ...themes]
      .map(row => row.syncedAt)
      .sort()
      .at(-1);
    return {
      songCount: songs.length,
      scheduleCount: schedules.length,
      themeCount: themes.length,
      lastSyncedAt,
    };
  }, []);
}
