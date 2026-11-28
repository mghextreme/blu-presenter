/** Paths of the public `/shared/...` pages, which are unlocked by the item's secret. */

interface SharedItem {
  id: number;
  secret?: string | null;
}

interface SharedSession extends SharedItem {
  organization?: { id: number };
}

const secretSegment = (secret?: string | null) => encodeURIComponent(secret ?? '');

export const sharedSongPath = (song: SharedItem) =>
  `/shared/view/${song.id}/${secretSegment(song.secret)}`;

export const sharedSongPrintPath = (song: SharedItem) =>
  `/shared/print/${song.id}/${secretSegment(song.secret)}`;

export const sharedSchedulePath = (schedule: SharedItem) =>
  `/shared/schedules/${schedule.id}/${secretSegment(schedule.secret)}`;

export const sharedRehearsalPath = (schedule: SharedItem) =>
  `${sharedSchedulePath(schedule)}/rehearsal`;

/** The receiver of a live session; `theme` preselects one (a base theme name or a theme id). */
export const sharedSessionPath = (session: SharedSession, theme?: string | number | null) =>
  `/shared/session/${session.organization?.id}/${session.id}/${secretSegment(session.secret)}${
    theme ? `/${theme}` : ''
  }`;

/** `path` on this app's origin, for links shared outside the app (clipboard, QR codes). */
export const absoluteUrl = (path: string) => new URL(path, window.location.origin).href;
