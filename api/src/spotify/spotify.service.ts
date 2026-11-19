import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request as ExpRequest } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { Schedule, SchedulePlaylistReference, Song, User } from 'src/entities';
import {
  CreateSchedulePlaylistDto,
  ISpotifyConnection,
  IUserSpotifyData,
  SchedulePlaylistSyncResult,
  SpotifyConnectionStatus,
} from 'src/types';
import { computeTracksHash, getSpotifyTrackId } from 'src/utils/spotify';
import { isAutoReference } from 'src/utils/schedule-references';
import { OrganizationsBaseService } from 'src/organizations/organizations.service';

const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/** Scopes requested when a user connects their Spotify account. */
const SPOTIFY_CONNECT_SCOPES = [
  'user-read-email',
  'user-read-private',
  'playlist-modify-private',
  'playlist-modify-public',
];

const SPOTIFY_AUTO_REFERENCE_SOURCE = 'spotify-auto';
const TRACKS_PER_REQUEST = 100;

/** Access tokens are considered stale this long before their real expiry. */
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

interface SpotifyTokenState {
  uid: number;
  exp: number;
}

/** The token endpoint rejected the refresh token (revoked or expired). */
class SpotifyInvalidGrantException extends BadRequestException {
  constructor() {
    super(
      'Spotify authorization is no longer valid. Please reconnect your account.',
    );
  }
}

@Injectable({ scope: Scope.REQUEST })
export class SpotifyService {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(REQUEST)
    private readonly request: ExpRequest,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Schedule)
    private readonly schedulesRepository: Repository<Schedule>,
    @InjectRepository(Song)
    private readonly songsRepository: Repository<Song>,
    @Inject(OrganizationsBaseService)
    private readonly organizationsBaseService: OrganizationsBaseService,
  ) {}

  /**
   * The current user's connection, loaded once per request (the service is
   * request-scoped) and kept in sync with every write below.
   */
  private connectionCache: Promise<IUserSpotifyData | null> | undefined;

  private get user(): User | undefined {
    return this.request.user?.['internal'] as User;
  }

  private get spotifyClientId(): string | undefined {
    return this.configService.get('spotify.clientId');
  }

  private get spotifyClientSecret(): string | undefined {
    return this.configService.get('spotify.clientSecret');
  }

  /** Whether the server has the credentials the Spotify API flow needs. */
  private get isConfigured(): boolean {
    return !!this.spotifyClientId && !!this.spotifyClientSecret;
  }

  /** Whether the user may connect their account and create playlists. */
  private isPlaylistsEnabled(data: IUserSpotifyData | null): boolean {
    return this.isConfigured && data?.enabled === true;
  }

  private async assertPlaylistsEnabled(): Promise<void> {
    if (!this.isConfigured) {
      throw new BadRequestException(
        'Spotify integration is not configured on this server',
      );
    }
    if (!this.isPlaylistsEnabled(await this.getConnection())) {
      throw new ForbiddenException(
        'Spotify playlists are not enabled for this account',
      );
    }
  }

  private get connectRedirectUri(): string {
    return (
      this.configService.get('app.baseUrl') + '/app/spotify/connect-callback'
    );
  }

  // ─── Connection status ──────────────────────────────────────────────────────

  private getConnection(): Promise<IUserSpotifyData | null> {
    this.connectionCache ??= this.loadConnection();
    return this.connectionCache;
  }

  private async loadConnection(): Promise<IUserSpotifyData | null> {
    const user = this.user;
    if (!user) return null;

    // Tokens are select:false on the entity — load them explicitly so they
    // can never leak through other code paths.
    const row = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.spotify')
      .where('user.id = :id', { id: user.id })
      .getOne();

    return row?.spotify ?? null;
  }

  private async requireConnection(): Promise<ISpotifyConnection> {
    const connection = await this.getConnection();
    if (!connection?.refreshToken) {
      throw new BadRequestException('Spotify account not connected');
    }
    return connection as ISpotifyConnection;
  }

  async getStatus(): Promise<SpotifyConnectionStatus> {
    return this.buildStatus(await this.getConnection());
  }

  private buildStatus(
    connection: IUserSpotifyData | null,
  ): SpotifyConnectionStatus {
    return {
      configured: this.isConfigured,
      playlistsEnabled: this.isPlaylistsEnabled(connection),
      connected: !!connection?.refreshToken,
      spotifyUserId: connection?.userId ?? null,
      spotifyDisplayName: connection?.displayName ?? null,
      scope: connection?.scope ?? null,
    };
  }

  // ─── OAuth connect flow ─────────────────────────────────────────────────────

  async getConnectUrl(): Promise<{ url: string }> {
    // The API connection only exists to manage playlists.
    await this.assertPlaylistsEnabled();

    const params = new URLSearchParams({
      client_id: this.spotifyClientId,
      response_type: 'code',
      redirect_uri: this.connectRedirectUri,
      state: this.createState(),
      scope: SPOTIFY_CONNECT_SCOPES.join(' '),
      show_dialog: 'false',
    });

    return { url: `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params.toString()}` };
  }

  async completeConnect(
    code: string,
    state: string,
  ): Promise<SpotifyConnectionStatus> {
    await this.assertPlaylistsEnabled();
    this.verifyState(state);

    const tokenData = await this.exchangeCodeForTokens(code);
    if (!tokenData.refresh_token) {
      // Without a refresh token the connection would expire within the hour
      // while still looking connected.
      throw new BadRequestException(
        'Spotify did not grant offline access. Please try connecting again.',
      );
    }
    const profile = await this.fetchSpotifyProfile(tokenData.access_token);

    const connection: ISpotifyConnection = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(
        Date.now() + tokenData.expires_in * 1000,
      ).toISOString(),
      scope: tokenData.scope ?? null,
      userId: profile.id,
      displayName: profile.display_name ?? null,
    };

    await this.saveConnection(connection);

    return this.getStatus();
  }

  async disconnect(): Promise<SpotifyConnectionStatus> {
    await this.saveConnection(null);

    return this.getStatus();
  }

  /**
   * Stores (or, with null, clears) the connection tokens. The `enabled` flag
   * shares the column but is managed in the database, so it is carried over
   * from the stored value rather than taken from `connection`.
   */
  private async saveConnection(
    connection: ISpotifyConnection | null,
  ): Promise<void> {
    const enabled = (await this.getConnection())?.enabled === true;
    let data: IUserSpotifyData | null = null;
    if (connection) {
      // Drop a stale flag that may ride along when spreading a loaded row.
      const { enabled: _stale, ...tokens } = connection as IUserSpotifyData;
      data = tokens;
    }
    if (enabled) {
      data = { ...data, enabled: true };
    }

    await this.usersRepository.update(this.user!.id, { spotify: data });
    this.connectionCache = Promise.resolve(data);
  }

  // ─── Schedule playlist sync ─────────────────────────────────────────────────

  async syncSchedulePlaylist(
    orgId: number,
    scheduleId: number,
    dto: CreateSchedulePlaylistDto,
  ): Promise<SchedulePlaylistSyncResult> {
    await this.assertPlaylistsEnabled();

    const schedule = await this.schedulesRepository.findOneBy({
      id: scheduleId,
      orgId,
    });
    if (!schedule) {
      throw new NotFoundException();
    }

    await this.organizationsBaseService.assertFeatureEnabled(
      orgId,
      'schedules',
    );

    const projection = await this.buildTrackProjection(schedule.items);
    // Malformed entries (non-objects) are dropped on every write.
    const references = (schedule.references ?? []).filter(
      (reference) => !!reference && typeof reference === 'object',
    );
    const existingReference = references.find(
      (reference): reference is SchedulePlaylistReference =>
        isAutoReference(reference) &&
        reference.source === SPOTIFY_AUTO_REFERENCE_SOURCE,
    );

    if (existingReference && existingReference.syncedBy !== this.user!.id) {
      throw new ForbiddenException(
        'Only the creator of the playlist can re-sync it',
      );
    }

    if (projection.trackUris.length === 0) {
      throw new BadRequestException(
        'No songs in this schedule have a Spotify reference',
      );
    }

    let reference: SchedulePlaylistReference;
    let action: 'created' | 'synced';

    if (existingReference) {
      action = 'synced';
      reference = existingReference;
    } else {
      action = 'created';
      const name =
        dto.name ?? this.defaultPlaylistName(schedule.title, schedule.date);
      const url = await this.createPlaylist(name, dto.public ?? false);

      // Persist the reference right away (still without a tracks hash, so it
      // shows as pending): if writing the tracks fails below, a retry
      // re-syncs this playlist instead of creating another empty one.
      reference = {
        url,
        name,
        source: SPOTIFY_AUTO_REFERENCE_SOURCE,
        syncedBy: this.user!.id,
        // Persist as absent (key dropped on JSON serialization), not null —
        // the frontend schema treats null metadata as invalid input.
        ...(this.user!.nickname != null && {
          syncedByName: this.user!.nickname,
        }),
      };
      references.push(reference);
      await this.saveReferences(schedule.id, references);
    }

    await this.replacePlaylistTracks(reference.url, projection.trackUris);

    reference.syncedAt = new Date().toISOString();
    reference.tracksHash = computeTracksHash(projection.trackIds);
    delete reference.syncedByMe;
    await this.saveReferences(schedule.id, references);

    return {
      action,
      url: reference.url,
      added: projection.trackUris.length,
      skipped: projection.skipped,
    };
  }

  /**
   * Detaches the auto-generated Spotify playlist from a schedule. The
   * playlist itself stays in its owner's Spotify library.
   */
  async removeSchedulePlaylist(
    orgId: number,
    scheduleId: number,
  ): Promise<void> {
    const schedule = await this.schedulesRepository.findOneBy({
      id: scheduleId,
      orgId,
    });
    if (!schedule) {
      throw new NotFoundException();
    }

    await this.organizationsBaseService.assertFeatureEnabled(
      orgId,
      'schedules',
    );

    const references = (schedule.references ?? []).filter(
      (reference) =>
        !!reference &&
        typeof reference === 'object' &&
        !(
          isAutoReference(reference) &&
          reference.source === SPOTIFY_AUTO_REFERENCE_SOURCE
        ),
    );
    await this.saveReferences(schedule.id, references);
  }

  private async saveReferences(
    scheduleId: number,
    references: Schedule['references'],
  ): Promise<void> {
    await this.schedulesRepository.update(scheduleId, { references });
  }

  private async buildTrackProjection(items: any[]): Promise<{
    trackIds: string[];
    trackUris: string[];
    skipped: { songId: number; title: string }[];
  }> {
    const songItems = (items ?? []).filter((item) => item.type === 'song');
    if (songItems.length === 0) {
      return { trackIds: [], trackUris: [], skipped: [] };
    }

    const songIds = [...new Set(songItems.map((item) => item.id))];
    const songs = await this.songsRepository
      .createQueryBuilder('song')
      .select(['song.id', 'song.title', 'song.references'])
      .where('song.id IN (:...songIds)', { songIds })
      .getMany();

    const songsMap = new Map(songs.map((song) => [song.id, song]));

    const trackIds: string[] = [];
    const trackUris: string[] = [];
    const skipped: { songId: number; title: string }[] = [];

    for (const item of songItems) {
      const song = songsMap.get(item.id);
      if (!song) {
        continue;
      }

      const trackId = (song.references ?? [])
        .map((reference) => getSpotifyTrackId(reference.url))
        .find((id) => id !== null);

      if (trackId) {
        trackIds.push(trackId);
        trackUris.push(`spotify:track:${trackId}`);
      } else {
        skipped.push({ songId: song.id, title: song.title });
      }
    }

    return { trackIds, trackUris, skipped };
  }

  private defaultPlaylistName(title: string, date: string | null): string {
    return date ? `${title} — ${date}` : title;
  }

  private async createPlaylist(
    name: string,
    isPublic: boolean,
  ): Promise<string> {
    const playlist = await this.spotifyApi<{
      id: string;
      external_urls: { spotify: string };
    }>('/me/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        public: isPublic,
        description: 'Generated by BluPresenter',
      }),
    });

    return (
      playlist.external_urls?.spotify ??
      `https://open.spotify.com/playlist/${playlist.id}`
    );
  }

  /**
   * Replaces all tracks of the playlist while keeping its id (so followers
   * and saved copies are preserved).
   */
  private async replacePlaylistTracks(
    playlistUrl: string,
    trackUris: string[],
  ): Promise<void> {
    const playlistId = this.extractPlaylistId(playlistUrl);

    // Spotify accepts up to 100 items per write request.
    const firstChunk = trackUris.slice(0, TRACKS_PER_REQUEST);
    await this.spotifyApi(
      `/playlists/${encodeURIComponent(playlistId)}/items`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: firstChunk }),
      },
    );

    for (
      let i = TRACKS_PER_REQUEST;
      i < trackUris.length;
      i += TRACKS_PER_REQUEST
    ) {
      await this.spotifyApi(
        `/playlists/${encodeURIComponent(playlistId)}/items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uris: trackUris.slice(i, i + TRACKS_PER_REQUEST),
          }),
        },
      );
    }
  }

  private extractPlaylistId(url: string): string {
    try {
      const parsed = new URL(url);
      const match = /\/playlist\/([a-zA-Z0-9]+)/.exec(parsed.pathname);
      if (parsed.hostname !== 'open.spotify.com' || !match) {
        throw new Error();
      }
      return match[1];
    } catch {
      throw new BadRequestException('Invalid Spotify playlist URL');
    }
  }

  // ─── Spotify API access with automatic token refresh ────────────────────────

  private async spotifyApi<T = unknown>(
    path: string,
    init: RequestInit = {},
    allowRefreshRetry: boolean = true,
    overrideAccessToken?: string,
  ): Promise<T> {
    let accessToken = overrideAccessToken;
    if (!accessToken) {
      const connection = await this.requireConnection();
      accessToken = await this.getValidAccessToken(connection);
    }

    const response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers ?? {}),
      },
    });

    if (response.status === 401 && allowRefreshRetry) {
      // The cached access token was rejected (e.g. revoked server-side).
      // Force a refresh and retry once.
      const connection = await this.requireConnection();
      const refreshedAccessToken = await this.refreshAccessToken(
        connection,
        true,
      );
      return this.spotifyApi<T>(path, init, false, refreshedAccessToken);
    }

    if (!response.ok) {
      await this.throwSpotifyError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async throwSpotifyError(response: Response): Promise<never> {
    const body = await response.text();
    let spMessage = body;
    try {
      spMessage = JSON.parse(body)?.error?.message ?? body;
    } catch {
      // keep raw body as the message
    }

    if (response.status === 404) {
      throw new NotFoundException(
        'The Spotify playlist no longer exists. Remove the playlist reference to generate a new one.',
      );
    }
    if (response.status === 403) {
      throw new ForbiddenException(
        `Spotify rejected the request: ${spMessage}`,
      );
    }
    throw new BadRequestException(`Spotify API error: ${spMessage}`);
  }

  private isTokenValid(connection: ISpotifyConnection): boolean {
    return (
      !!connection.accessToken &&
      new Date(connection.expiresAt).getTime() >
        Date.now() + TOKEN_EXPIRY_MARGIN_MS
    );
  }

  private async getValidAccessToken(
    connection: ISpotifyConnection,
  ): Promise<string> {
    if (this.isTokenValid(connection)) {
      return connection.accessToken;
    }
    return this.refreshAccessToken(connection, false);
  }

  /**
   * Refreshes the Spotify access token using the stored refresh token and
   * persists the updated connection. Spotify occasionally rotates refresh
   * tokens, so the returned refresh token (if any) always replaces the
   * stored one. With `force`, a still-valid cached token is bypassed.
   */
  private async refreshAccessToken(
    connection: ISpotifyConnection,
    force: boolean,
  ): Promise<string> {
    if (!force && this.isTokenValid(connection)) {
      return connection.accessToken;
    }

    let data: SpotifyTokenResponse;
    try {
      data = await this.requestToken(
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refreshToken!,
          // The refresh token was issued through the (non-PKCE) Authorization
          // Code flow, so the token endpoint requires the client credentials —
          // without the secret it rejects the request with an empty
          // `invalid_request`.
          client_id: this.spotifyClientId!,
          client_secret: this.spotifyClientSecret!,
        }),
      );
    } catch (e) {
      if (e instanceof SpotifyInvalidGrantException) {
        // The refresh token is dead: drop the connection so the UI asks the
        // user to reconnect instead of offering syncs that always fail.
        await this.saveConnection(null);
      }
      throw e;
    }

    if (!data.access_token) {
      throw new BadRequestException(
        'Spotify authorization is no longer valid. Please reconnect your account.',
      );
    }

    const updated: ISpotifyConnection = {
      ...connection,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? connection.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope ?? connection.scope,
    };

    await this.saveConnection(updated);

    return updated.accessToken;
  }

  // ─── Token endpoint helpers ─────────────────────────────────────────────────

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<SpotifyTokenResponse> {
    return this.requestToken(
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.connectRedirectUri,
        client_id: this.spotifyClientId!,
        client_secret: this.spotifyClientSecret!,
      }),
    );
  }

  private async requestToken(
    body: URLSearchParams,
  ): Promise<SpotifyTokenResponse> {
    let response: Response;
    try {
      response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      throw new BadRequestException('Failed to reach Spotify');
    }

    if (!response.ok) {
      const errorBody = await response.text();
      if (errorBody.includes('invalid_grant')) {
        throw new SpotifyInvalidGrantException();
      }
      throw new BadRequestException(`Spotify token error: ${errorBody}`);
    }

    return (await response.json()) as SpotifyTokenResponse;
  }

  private async fetchSpotifyProfile(
    accessToken: string,
  ): Promise<{ id: string; display_name: string | null }> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch Spotify profile');
    }

    return (await response.json()) as {
      id: string;
      display_name: string | null;
    };
  }

  // ─── OAuth state signing (CSRF protection) ──────────────────────────────────

  private createState(): string {
    const payload = Buffer.from(
      JSON.stringify({
        uid: this.user!.id,
        exp: Date.now() + 10 * 60 * 1000,
      } satisfies SpotifyTokenState),
    ).toString('base64url');

    return `${payload}.${this.signStatePayload(payload)}`;
  }

  private verifyState(state: string): void {
    const [payload, signature] = (state ?? '').split('.');
    if (!payload || !signature) {
      throw new BadRequestException('Invalid OAuth state');
    }

    const expected = this.signStatePayload(payload);
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      throw new BadRequestException('Invalid OAuth state');
    }

    let data: SpotifyTokenState;
    try {
      data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch {
      throw new BadRequestException('Invalid OAuth state');
    }

    if (data.uid !== this.user!.id) {
      throw new BadRequestException('Invalid OAuth state');
    }
    if (!data.exp || data.exp < Date.now()) {
      throw new BadRequestException('OAuth state expired, please try again');
    }
  }

  private signStatePayload(payload: string): string {
    const secret = this.configService.get('spotify.stateSecret');
    if (!secret) {
      // Reaching here means the Spotify integration is not configured
      // (the connect URL endpoint already guards on clientId/secret, but
      // completeConnect can also arrive here on its own).
      throw new BadRequestException(
        'Spotify integration is not configured on this server',
      );
    }
    return createHmac('sha256', secret).update(payload).digest('base64url');
  }
}
