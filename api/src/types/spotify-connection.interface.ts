/**
 * Spotify connection credentials stored on the user (`users.spotify` jsonb
 * column). Server-side only: the column is `select: false`, so it is never
 * loaded by default and can never leak through entity serialization.
 */
export interface ISpotifyConnection {
  accessToken: string;
  /** Long-lived; Spotify may rotate it on refresh — always persist the latest. */
  refreshToken: string | null;
  expiresAt: string;
  scope: string | null;
  userId: string;
  displayName: string | null;
}

/**
 * Contents of the `users.spotify` jsonb column: the playlist access flag plus,
 * once the user connects their account, the connection tokens.
 *
 * `enabled` is managed directly in the database (users cannot change it) and
 * gates the playlist features. It is kept across connects, token refreshes
 * and disconnects, so an enabled user who never connected is stored as
 * `{ "enabled": true }`.
 */
export interface IUserSpotifyData extends Partial<ISpotifyConnection> {
  enabled?: boolean;
}
