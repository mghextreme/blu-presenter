import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { OfflineDownloadsService } from "../offline-downloads.service";
import { REVALIDATED_AT_KEY } from "@/lib/offline/db";

/**
 * In-memory fake of the Dexie database (offlineDb). The real module is mocked
 * so these tests run without IndexedDB.
 */
function createFakeDb() {
  const songs = new Map();
  const schedules = new Map();
  const themes = new Map();
  const meta = new Map();
  const table = (map: Map<number | string, unknown>) => ({
    get: async (key: any) => map.get(key),
    put: async (row: any) => { map.set(row.key ?? row.id, row); return row.id ?? row.key; },
    bulkPut: async (rows: any[]) => { rows.forEach(row => map.set(row.id, row)); },
    bulkGet: async (keys: any[]) => keys.map(key => map.get(key)),
    delete: async (key: any) => { map.delete(key); },
    toArray: async () => [...map.values()],
    clear: async () => { map.clear(); },
  });
  return {
    songs: table(songs),
    schedules: table(schedules),
    themes: table(themes),
    meta: table(meta),
    transaction: async (_mode: string, _tables: unknown, fn: () => Promise<void>) => { await fn(); },
    _maps: { songs, schedules, themes, meta },
  };
}

const fakeDb = vi.hoisted(() => createFakeDb());

vi.mock("@/lib/offline/db", () => ({
  offlineDb: fakeDb,
  REVALIDATED_AT_KEY: "lastRevalidatedAt",
}));

const songsService = {
  getById: vi.fn(),
  search: vi.fn(),
};
const schedulesService = {
  getById: vi.fn(),
  fetchById: vi.fn(),
};
const themesService = {
  getAllForUser: vi.fn(),
};

function createService() {
  return new OfflineDownloadsService(
    new QueryClient(),
    songsService as any,
    schedulesService as any,
    themesService as any,
    fakeDb as any,
  );
}

const song = (id: number, title = `Song ${id}`) => ({
  id,
  title,
  blocks: [],
  organization: { id: 7, name: "Org" },
});

const theme = (id: number) => ({ id, name: `Theme ${id}`, extends: "lyrics" });

describe("OfflineDownloadsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeDb._maps.songs.clear();
    fakeDb._maps.schedules.clear();
    fakeDb._maps.themes.clear();
    fakeDb._maps.meta.clear();
    themesService.getAllForUser.mockResolvedValue([theme(1)]);
  });

  it("downloads a song and syncs the theme list", async () => {
    songsService.getById.mockResolvedValue(song(5));
    const service = createService();

    await service.downloadSong(5);

    const row = fakeDb._maps.songs.get(5);
    expect(row).toMatchObject({ id: 5, orgId: 7, title: "Song 5" });
    expect(row.payload.blocks).toEqual([]);
    expect(fakeDb._maps.themes.get(1)).toMatchObject({ id: 1, orgId: 0, name: "Theme 1" });
  });

  it("downloads a schedule, only fetching songs that are not stored yet", async () => {
    const schedule = {
      id: 100,
      title: "Sunday",
      organization: { id: 7 },
      items: [
        { id: 11, type: "song" },
        { id: 12, type: "song" },
        { id: 999, type: "comment" },
      ],
    };
    schedulesService.fetchById.mockResolvedValue(schedule);
    // Song 11 is already stored; only song 12 must be fetched.
    fakeDb._maps.songs.set(11, { id: 11 });
    songsService.getById.mockResolvedValue(song(12));
    const service = createService();

    await service.downloadSchedule(100);

    expect(schedulesService.fetchById).toHaveBeenCalledWith(100);
    expect(songsService.getById).toHaveBeenCalledTimes(1);
    expect(songsService.getById).toHaveBeenCalledWith(12);
    expect(fakeDb._maps.schedules.get(100)).toMatchObject({ id: 100, orgId: 7 });
    expect(fakeDb._maps.songs.get(12)).toMatchObject({ id: 12, orgId: 7 });
  });

  it("keeps the schedule when a referenced song fails to download", async () => {
    const schedule = {
      id: 100,
      title: "Sunday",
      organization: { id: 7 },
      items: [{ id: 12, type: "song" }],
    };
    schedulesService.fetchById.mockResolvedValue(schedule);
    songsService.getById.mockRejectedValue(new Error("offline"));
    const service = createService();

    await expect(service.downloadSchedule(100)).resolves.toBeUndefined();
    expect(fakeDb._maps.schedules.get(100)).toMatchObject({ id: 100 });
  });

  it("revalidates downloaded content and removes deleted songs", async () => {
    fakeDb._maps.songs.set(5, { id: 5, orgId: 7, syncedAt: "old" });
    fakeDb._maps.songs.set(6, { id: 6, orgId: 7, syncedAt: "old" });
    songsService.getById.mockImplementation(async (id: number) =>
      id === 5 ? song(5, "Song 5 (updated)") : null, // song 6 was deleted server-side
    );
    const service = createService();

    await service.revalidateAll();

    expect(fakeDb._maps.songs.get(5).payload.title).toBe("Song 5 (updated)");
    expect(fakeDb._maps.songs.get(5).orgId).toBe(7); // org tag preserved
    expect(fakeDb._maps.songs.has(6)).toBe(false);
    expect(typeof fakeDb._maps.meta.get(REVALIDATED_AT_KEY).value).toBe("number");
  });

  it("throttles revalidation within the throttle window", async () => {
    fakeDb._maps.songs.set(5, { id: 5, orgId: 7, syncedAt: "old" });
    songsService.getById.mockResolvedValue(song(5));
    const service = createService();

    await service.revalidateAll(true);
    await service.revalidateAll(false);

    expect(songsService.getById).toHaveBeenCalledTimes(1);
    expect(themesService.getAllForUser).toHaveBeenCalledTimes(1);

    // Forced revalidation bypasses the throttle.
    await service.revalidateAll(true);
    expect(songsService.getById).toHaveBeenCalledTimes(2);
  });

  it("does nothing when the device is offline", async () => {
    const original = navigator.onLine;
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    try {
      const service = createService();
      await service.revalidateAll(true);
      expect(themesService.getAllForUser).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: original });
    }
  });
});
