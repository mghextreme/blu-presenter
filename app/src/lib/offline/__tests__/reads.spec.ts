import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  getOfflineSongById,
  searchOfflineSongs,
  searchOfflineSchedules,
  getOfflineThemes,
  searchOfflineThemes,
} from "../reads";

function createFakeDb() {
  const songs = new Map();
  const schedules = new Map();
  const themes = new Map();
  const meta = new Map();
  const table = (map: Map<unknown, unknown>) => ({
    get: async (key: any) => map.get(key),
    put: async (row: any) => { map.set(row.key ?? row.id, row); },
    bulkPut: async (rows: any[]) => { rows.forEach(row => map.set(row.id, row)); },
    delete: async (key: any) => { map.delete(key); },
    toArray: async () => [...map.values()],
    clear: async () => { map.clear(); },
  });
  return {
    songs: table(songs),
    schedules: table(schedules),
    themes: table(themes),
    meta: table(meta),
    transaction: async (_m: string, _t: unknown, fn: () => Promise<void>) => { await fn(); },
    _maps: { songs, schedules, themes, meta },
  };
}

const fakeDb = vi.hoisted(() => createFakeDb());

vi.mock("@/lib/offline/db", () => ({
  offlineDb: fakeDb,
  REVALIDATED_AT_KEY: "lastRevalidatedAt",
}));

const songRow = (id: number, title: string, artist?: string) => ({
  id,
  orgId: 7,
  title,
  artist,
  syncedAt: "2026-01-01",
  payload: { id, title, artist },
});

const scheduleRow = (id: number, title: string, date?: string | null) => ({
  id,
  orgId: 7,
  title,
  date,
  syncedAt: "2026-01-01",
  payload: { id, title, date, items: [] },
});

describe("offline reads", () => {
  beforeEach(() => {
    fakeDb._maps.songs.clear();
    fakeDb._maps.schedules.clear();
    fakeDb._maps.themes.clear();
    fakeDb._maps.meta.clear();
  });

  describe("songs", () => {
    beforeEach(() => {
      fakeDb._maps.songs.set(1, songRow(1, "Amazing Grace", "Unknown"));
      fakeDb._maps.songs.set(2, songRow(2, "Bless the Lord"));
      fakeDb._maps.songs.set(3, songRow(3, "Greater Than All"));
    });

    it("returns the stored payload by id", async () => {
      expect(await getOfflineSongById(1)).toMatchObject({ id: 1, title: "Amazing Grace" });
      expect(await getOfflineSongById(99)).toBeNull();
    });

    it("searches by title and artist, newest first", async () => {
      const results = await searchOfflineSongs({ query: "grace" });
      expect(results.map(s => s.id)).toEqual([1]); // title match only
    });

    it("matches artist case-insensitively", async () => {
      const results = await searchOfflineSongs({ query: "unknown" });
      expect(results.map(s => s.id)).toEqual([1]);
    });

    it("paginates results", async () => {
      const page1 = await searchOfflineSongs({ page: 1, itemsPerPage: 2 });
      const page2 = await searchOfflineSongs({ page: 2, itemsPerPage: 2 });
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
      expect(page1[0].id).toBe(3); // newest first
    });
  });

  describe("schedules", () => {
    beforeEach(() => {
      fakeDb._maps.schedules.set(1, scheduleRow(1, "Sunday Service", "2026-10-25"));
      fakeDb._maps.schedules.set(2, scheduleRow(2, "Rehearsal", "2026-10-23"));
      fakeDb._maps.schedules.set(3, scheduleRow(3, "Undated event", null));
    });

    it("filters by title query", async () => {
      const results = await searchOfflineSchedules({ query: "SUNDAY" });
      expect(results.map(s => s.id)).toEqual([1]);
    });

    it("filters by date range and sorts newest date first (undated last)", async () => {
      const results = await searchOfflineSchedules({ dateFrom: "2026-10-23", dateTo: "2026-10-25" });
      expect(results.map(s => s.id)).toEqual([1, 2]);
    });
  });

  describe("themes", () => {
    beforeEach(() => {
      fakeDb._maps.themes.set(1, { id: 1, orgId: 7, name: "Midnight", syncedAt: "", payload: { id: 1, name: "Midnight" } });
      fakeDb._maps.themes.set(2, { id: 2, orgId: 7, name: "Classic", syncedAt: "", payload: { id: 2, name: "Classic" } });
    });

    it("returns all stored themes", async () => {
      const themes = await getOfflineThemes();
      expect(themes).toHaveLength(2);
    });

    it("searches by name", async () => {
      const themes = await searchOfflineThemes({ query: "mid" });
      expect(themes.map(t => t.id)).toEqual([1]);
    });
  });
});
