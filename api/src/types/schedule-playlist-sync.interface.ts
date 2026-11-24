export interface SchedulePlaylistSyncResult {
  action: 'created' | 'synced';
  url: string;
  added: number;
  skipped: {
    songId: number;
    title: string;
  }[];
}

export interface PlaylistConnectionStatus {
  /** Whether the integration is configured on this server. */
  configured: boolean;
  /** Whether the current user may create/sync playlists (configured and the
   * `enabled` flag is set for the user). */
  playlistsEnabled: boolean;
  connected: boolean;
  /** The account id on the provider (Spotify user id, YouTube channel id). */
  accountId: string | null;
  accountName: string | null;
  scope: string | null;
}
