import { QueryClient } from "@tanstack/react-query";
import { ISchedule, ISongWithRole, ITheme } from "@/types";
import {
  OfflineDatabase,
  OfflineSongRow,
  OfflineScheduleRow,
  OfflineThemeRow,
  REVALIDATED_AT_KEY,
  offlineDb,
} from "@/lib/offline/db";
import { SongsService } from "./songs.service";
import { SchedulesService } from "./schedules.service";
import { ThemesService } from "./themes.service";

/**
 * Orchestrates explicit offline downloads (read-only). Downloading a schedule
 * also downloads every song it references (items embed slide snapshots, but
 * songs may also be opened standalone from the plan panel) and refreshes the
 * theme list — themes are tiny and always needed to present.
 *
 * All operations store full API payloads in the offline database. The service
 * never reads from the database for presenting; that fallback is wired at the
 * service/loaders layer (offline reads).
 */
export class OfflineDownloadsService {

  private static readonly REVALIDATE_THROTTLE_MS = 5 * 60 * 1000;

  constructor(
    private readonly queryClient: QueryClient,
    private readonly songsService: SongsService,
    private readonly schedulesService: SchedulesService,
    private readonly themesService: ThemesService,
    private readonly db: OfflineDatabase = offlineDb,
  ) {
  }

  async downloadSong(songId: number): Promise<void> {
    const song = await this.fetchFreshSong(songId);
    if (!song) return;
    await this.storeSong(song);
    await this.syncThemes();
  }

  async downloadSchedule(scheduleId: number): Promise<void> {
    // fetchById bypasses the query cache so the download is fresh.
    const schedule = await this.schedulesService.fetchById(scheduleId) as ISchedule | null;
    if (!schedule) return;

    await this.storeSchedule(schedule);

    // Top up every song referenced by the schedule that is not downloaded yet.
    const songIds = this.extractScheduleSongIds(schedule);
    const stored = await this.db.songs.bulkGet(songIds);
    const missing = songIds.filter((_, ix) => !stored[ix]);
    await Promise.all(missing.map(async (songId) => {
      try {
        const song = await this.fetchFreshSong(songId);
        if (song) await this.storeSong(song);
      } catch {
        // Partial downloads are acceptable: the schedule itself embeds the
        // slides needed to present. Revalidation tops up missing songs later.
      }
    }));

    await this.syncThemes();
  }

  async removeSong(songId: number): Promise<void> {
    await this.db.songs.delete(songId);
  }

  async removeSchedule(scheduleId: number): Promise<void> {
    await this.db.schedules.delete(scheduleId);
  }

  /**
   * Refreshes downloaded content from the API (stale-while-revalidate).
   * Throttled unless forced. Individual failures keep the stale row as-is.
   */
  async revalidateAll(force = false): Promise<void> {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    const meta = await this.db.meta.get(REVALIDATED_AT_KEY);
    const last = typeof meta?.value === "number" ? meta.value : 0;
    if (!force && Date.now() - last < OfflineDownloadsService.REVALIDATE_THROTTLE_MS) return;
    await this.db.meta.put({ key: REVALIDATED_AT_KEY, value: Date.now() });

    await this.syncThemes();

    const schedules = await this.db.schedules.toArray();
    await Promise.all(schedules.map(async (row) => {
      try {
        const fresh = await this.schedulesService.fetchById(row.id) as ISchedule | null;
        if (fresh) {
          await this.storeSchedule(fresh);
          // Top up songs that may have been added to the schedule.
          const songIds = this.extractScheduleSongIds(fresh);
          const stored = await this.db.songs.bulkGet(songIds);
          const missing = songIds.filter((_, ix) => !stored[ix]);
          await Promise.all(missing.map(async (songId) => {
            try {
              const song = await this.fetchFreshSong(songId);
              if (song) await this.storeSong(song);
            } catch { /* keep partial; retried next revalidation */ }
          }));
        }
      } catch { /* keep stale row */ }
    }));

    const songs = await this.db.songs.toArray();
    await Promise.all(songs.map(async (row) => {
      try {
        const fresh = await this.fetchFreshSong(row.id);
        if (fresh) await this.storeSong(fresh, row.orgId);
        else await this.removeSong(row.id); // 404: song no longer exists
      } catch { /* keep stale row */ }
    }));
  }

  /** Refreshes the whole theme table (themes have no updatedAt). */
  private async syncThemes(): Promise<void> {
    // Themes are cached aggressively in the query client; drop the cache to
    // guarantee a fresh fetch for the offline copy.
    this.queryClient.removeQueries({ queryKey: ["themes"] });
    const themes = await this.themesService.getAllForUser() as ITheme[];
    const syncedAt = new Date().toISOString();
    const rows: OfflineThemeRow[] = themes.map(theme => ({
      id: theme.id,
      orgId: theme.organization?.id ?? 0,
      name: theme.name,
      syncedAt,
      payload: theme,
    }));
    await this.db.transaction("rw", this.db.themes, async () => {
      await this.db.themes.clear();
      await this.db.themes.bulkPut(rows);
    });
  }

  private extractScheduleSongIds(schedule: ISchedule): number[] {
    return (schedule.items ?? [])
      .filter(item => item.type === "song")
      .map(item => item.id)
      .filter(id => Number.isFinite(id));
  }

  private async fetchFreshSong(songId: number): Promise<ISongWithRole | null> {
    this.queryClient.removeQueries({ queryKey: ["songs", "id", songId] });
    return await this.songsService.getById(songId) as ISongWithRole | null;
  }

  private toSongRow(song: ISongWithRole, previousOrgId?: number): OfflineSongRow {
    return {
      id: song.id,
      // Some endpoints (e.g. GET /songs/:id) may not include the organization
      // wrapper: preserve the previously stored org tag in that case.
      orgId: song.organization?.id ?? previousOrgId ?? 0,
      title: song.title,
      artist: song.artist,
      updatedAt: song.updatedAt,
      syncedAt: new Date().toISOString(),
      payload: song,
    };
  }

  private async storeSong(song: ISongWithRole, previousOrgId?: number): Promise<void> {
    await this.db.songs.put(this.toSongRow(song, previousOrgId));
  }

  private async storeSchedule(schedule: ISchedule): Promise<void> {
    const row: OfflineScheduleRow = {
      id: schedule.id,
      orgId: schedule.organization?.id ?? 0,
      title: schedule.title,
      date: schedule.date,
      syncedAt: new Date().toISOString(),
      payload: schedule,
    };
    await this.db.schedules.put(row);
  }

}
