export interface SchedulePlaylistSyncResult {
  action: 'created' | 'synced';
  url: string;
  added: number;
  skipped: {
    songId: number;
    title: string;
  }[];
}

export interface SpotifyConnectionStatus {
  connected: boolean;
  spotifyUserId: string | null;
  spotifyDisplayName: string | null;
  scope: string | null;
}
