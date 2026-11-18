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
  /** Whether the Spotify integration is configured on this server. */
  configured: boolean;
  /** Whether the current user may create/sync playlists (configured and the
   * user has the `spotify-playlists` feature). */
  playlistsEnabled: boolean;
  connected: boolean;
  spotifyUserId: string | null;
  spotifyDisplayName: string | null;
  scope: string | null;
}
