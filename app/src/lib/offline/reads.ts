import { ISchedule, ISongWithRole, ITheme } from "@/types";
import { offlineDb } from "./db";

/**
 * Read-only queries over the offline download store ("reads" half of the
 * offline data layer). Services call these when the device is offline or a
 * network request fails, so lists and detail views keep working offline.
 */

export async function getOfflineSongById(id: number): Promise<ISongWithRole | null> {
  const row = await offlineDb.songs.get(id);
  return row?.payload ?? null;
}

export async function searchOfflineSongs(payload: {
  query?: string;
  page?: number;
  itemsPerPage?: number;
}): Promise<ISongWithRole[]> {
  const query = payload.query?.trim().toLowerCase() ?? '';
  let rows = await offlineDb.songs.toArray();
  if (query) {
    rows = rows.filter(row =>
      row.title.toLowerCase().includes(query)
      || (row.artist ?? '').toLowerCase().includes(query));
  }
  // Newest (highest id) first, mirroring the API ordering.
  rows.sort((a, b) => b.id - a.id);
  return paginate(rows.map(row => row.payload), payload.page, payload.itemsPerPage);
}

export async function getOfflineScheduleById(id: number): Promise<ISchedule | null> {
  const row = await offlineDb.schedules.get(id);
  return row?.payload ?? null;
}

export async function searchOfflineSchedules(payload: {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  itemsPerPage?: number;
}): Promise<ISchedule[]> {
  const query = payload.query?.trim().toLowerCase() ?? '';
  let rows = await offlineDb.schedules.toArray();
  if (query) {
    rows = rows.filter(row => row.title.toLowerCase().includes(query));
  }
  if (payload.dateFrom) {
    rows = rows.filter(row => (row.date ?? '') >= payload.dateFrom!);
  }
  if (payload.dateTo) {
    rows = rows.filter(row => (row.date ?? '') <= payload.dateTo!);
  }
  // Next date first (upcoming schedules at the top), undated last.
  rows.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  return paginate(rows.map(row => row.payload), payload.page, payload.itemsPerPage);
}

export async function getOfflineThemes(): Promise<ITheme[]> {
  const rows = await offlineDb.themes.toArray();
  return rows.map(row => row.payload);
}

export async function getOfflineThemeById(id: number): Promise<ITheme | null> {
  const row = await offlineDb.themes.get(id);
  return row?.payload ?? null;
}

export async function searchOfflineThemes(payload: {
  query?: string;
  page?: number;
  itemsPerPage?: number;
}): Promise<ITheme[]> {
  const query = payload.query?.trim().toLowerCase() ?? '';
  let rows = await offlineDb.themes.toArray();
  if (query) {
    rows = rows.filter(row => row.name.toLowerCase().includes(query));
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return paginate(rows.map(row => row.payload), payload.page, payload.itemsPerPage);
}

/** Applies page/itemsPerPage after they, mirroring the REST list endpoints. */
function paginate<T>(items: T[], page?: number, itemsPerPage?: number): T[] {
  if (!page || !itemsPerPage) return items;
  const start = (page - 1) * itemsPerPage;
  return items.slice(start, start + itemsPerPage);
}
