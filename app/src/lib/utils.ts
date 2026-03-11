import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { IScheduleItem } from "@/types/schedule-item.interface"
import { IScheduleSong } from "@/types/schedule-song.interface"
import { IScheduleText } from "@/types/schedule-text.interface"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isTokenExpired(token: string | undefined | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Add a 30-second buffer so we refresh slightly before actual expiry
    return payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

/**
 * djb2-style hash: fast, deterministic, no external dependencies.
 * Returns a hex string for use in IDs.
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert to unsigned 32-bit and then hex
  return (hash >>> 0).toString(16);
}

/**
 * Generates a stable uniqueId for a schedule item at the given index.
 *
 * - Songs: `<id>_<updatedAt>_<index>` — stable as long as the song and its
 *   position in the schedule do not change.
 * - Non-song items (text, comment, …): `hash(<title><subtitle>)_<index>` —
 *   content-derived so the ID survives page reloads without relying on
 *   wall-clock time.
 */
export function generateScheduleItemUniqueId(item: IScheduleItem, index: number): string {
  if (item.type === 'song') {
    const song = item as IScheduleSong;
    return `${song.id}_${song.updatedAt ?? ''}_${index}`;
  }

  const text = item as IScheduleText;
  const content = `${text.title ?? ''}|${text.subtitle ?? ''}`;
  return `${hashString(content)}_${index}`;
}
