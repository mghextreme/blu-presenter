/**
 * OAuth connection credentials of a playlist integration (Spotify, YouTube),
 * stored on the user in a jsonb column named after the provider
 * (`users.spotify`, `users.youtube`). Server-side only: the columns are
 * `select: false`, so they are never loaded by default and can never leak
 * through entity serialization.
 */
export interface IPlaylistConnection {
  accessToken: string;
  /** Long-lived; providers may rotate it on refresh — always persist the latest. */
  refreshToken: string | null;
  expiresAt: string;
  scope: string | null;
  /** The account id on the provider (Spotify user id, YouTube channel id). */
  userId: string;
  displayName: string | null;
}

/**
 * Contents of a provider's jsonb column: the playlist access flag plus, once
 * the user connects their account, the connection tokens.
 *
 * `enabled` is managed directly in the database (users cannot change it) and
 * gates the playlist features. It is kept across connects, token refreshes
 * and disconnects, so an enabled user who never connected is stored as
 * `{ "enabled": true }`.
 */
export interface IUserPlaylistIntegrationData extends Partial<IPlaylistConnection> {
  enabled?: boolean;
}
