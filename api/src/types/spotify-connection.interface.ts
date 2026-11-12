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
