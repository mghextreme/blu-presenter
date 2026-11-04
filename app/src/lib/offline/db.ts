import Dexie, { Table } from "dexie";
import { ISchedule, ISongWithRole, ITheme } from "@/types";

/**
 * Local offline content store ("downloads"), backed by IndexedDB via Dexie.
 *
 * Rows are explicit user downloads (see OfflineDownloadsService), keyed by
 * entity id and tagged with the organization they belong to (`orgId`; 0 for
 * content without an organization, e.g. public archive songs). `syncedAt` is
 * the timestamp of the last successful refresh of the row from the API.
 */
export interface OfflineSongRow {
  id: number;
  orgId: number;
  title: string;
  artist?: string;
  updatedAt?: string;
  syncedAt: string;
  payload: ISongWithRole;
}

export interface OfflineScheduleRow {
  id: number;
  orgId: number;
  title: string;
  date?: string | null;
  syncedAt: string;
  payload: ISchedule;
}

export interface OfflineThemeRow {
  id: number;
  orgId: number;
  name: string;
  syncedAt: string;
  payload: ITheme;
}

export interface OfflineMetaRow {
  key: string;
  value: unknown;
}

export class OfflineDatabase extends Dexie {
  songs!: Table<OfflineSongRow, number>;
  schedules!: Table<OfflineScheduleRow, number>;
  themes!: Table<OfflineThemeRow, number>;
  meta!: Table<OfflineMetaRow, string>;

  constructor() {
    super("blu-presenter-offline");
    this.version(1).stores({
      songs: "id, orgId, title, artist, updatedAt",
      schedules: "id, orgId, title, date",
      themes: "id, orgId, name",
      meta: "key",
    });
  }
}

/**
 * Shared singleton. Throws at import time only in environments without
 * IndexedDB (e.g. jsdom tests), which are expected to mock this module.
 */
export const offlineDb = new OfflineDatabase();

export const REVALIDATED_AT_KEY = "lastRevalidatedAt";
