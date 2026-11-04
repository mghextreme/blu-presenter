import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/types";

import { SongsService } from "../songs.service";
import { SchedulesService } from "../schedules.service";
import { ThemesService } from "../themes.service";
import { BroadcastService } from "../broadcast.service";

/**
 * Fallback behavior: when the device is offline (or a request fails at the
 * transport level), read paths resolve from the offline store instead of
 * throwing. Server rejections (ApiError) must still surface as errors.
 */

const reads = vi.hoisted(() => ({
  getOfflineSongById: vi.fn(),
  searchOfflineSongs: vi.fn(),
  getOfflineScheduleById: vi.fn(),
  searchOfflineSchedules: vi.fn(),
  getOfflineThemes: vi.fn(),
  getOfflineThemeById: vi.fn(),
  searchOfflineThemes: vi.fn(),
}));

vi.mock("@/lib/offline/reads", () => reads);

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function setOnline(online: boolean) {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: online });
}

const queryClient = createQueryClient();
const songsService = new SongsService(queryClient, { url: "http://api.test" });
const schedulesService = new SchedulesService(queryClient, { url: "http://api.test" });
const themesService = new ThemesService(queryClient, { url: "http://api.test" });
const broadcastService = new BroadcastService(queryClient, { url: "http://api.test" });

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  setOnline(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  setOnline(true);
});

describe("offline read fallbacks", () => {
  it("songsService.getById falls back when offline", async () => {
    setOnline(false);
    reads.getOfflineSongById.mockResolvedValue({ id: 5, title: "Offline song" });

    const result = await songsService.getById(5);

    expect(result).toMatchObject({ id: 5 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("songsService.getById falls back on network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    reads.getOfflineSongById.mockResolvedValue({ id: 5, title: "Offline song" });

    const result = await songsService.getById(5);

    expect(result).toMatchObject({ id: 5 });
    expect(reads.getOfflineSongById).toHaveBeenCalledWith(5);
  });

  it("songsService.search falls back on network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    reads.searchOfflineSongs.mockResolvedValue([{ id: 1 }]);

    const result = await songsService.search({ query: "grace" });

    expect(result).toEqual([{ id: 1 }]);
    expect(reads.searchOfflineSongs).toHaveBeenCalledWith({ query: "grace" });
  });

  it("schedulesService.getById falls back on network failure (including forced refresh)", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    reads.getOfflineScheduleById.mockResolvedValue({ id: 100, title: "Sunday" });

    const result = await schedulesService.fetchById(100);

    expect(result).toMatchObject({ id: 100 });
  });

  it("schedulesService.search falls back on network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    reads.searchOfflineSchedules.mockResolvedValue([{ id: 100 }]);

    const result = await schedulesService.search({ query: "x" });

    expect(result).toEqual([{ id: 100 }]);
  });

  it("themesService.getAllForUser/getById/search fall back on network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    reads.getOfflineThemes.mockResolvedValue([{ id: 1, name: "Midnight" }]);
    reads.getOfflineThemeById.mockResolvedValue({ id: 1, name: "Midnight" });
    reads.searchOfflineThemes.mockResolvedValue([{ id: 1 }]);

    expect(await themesService.getAllForUser()).toEqual([{ id: 1, name: "Midnight" }]);
    expect(await themesService.getById(1)).toMatchObject({ id: 1 });
    expect(await themesService.search({ query: "mid" })).toEqual([{ id: 1 }]);
  });

  it("server errors (ApiError) are not swallowed by the fallback", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(songsService.getById(5)).rejects.toBeInstanceOf(ApiError);
    expect(reads.getOfflineSongById).not.toHaveBeenCalled();
  });

  it("broadcast writes are skipped silently when offline", async () => {
    setOnline(false);

    await expect(
      broadcastService.setSchedule(1, 7, []),
    ).resolves.toBeUndefined();
    await expect(
      broadcastService.setScheduleItem(1, 7, {}),
    ).resolves.toBeUndefined();
    await expect(
      broadcastService.setSelection(1, 7, {}),
    ).resolves.toBeUndefined();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
