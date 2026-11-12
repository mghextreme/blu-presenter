import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  UnauthorizedException,
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
  SchedulePlaylistSyncResult,
  SpotifyConnectionStatus,
} from 'src/types';
import { computeTracksHash, getSpotifyTrackId } from 'src/utils/spotify';
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

  private get user(): User | undefined {
    return this.request.user?.['internal'] as User;
  }

  private get spotifyClientId(): string | undefined {
    return this.configService.get('spotify.clientId');
  }

  private get spotifyClientSecret(): string | undefined {
    return this.configService.get('spotify.clientSecret');
  }

  private get connectRedirectUri(): string {
    return (
      this.configService.get('app.baseUrl') + '/app/spotify/connect-callback'
    );
  }

  // ─── Connection status ──────────────────────────────────────────────────────

  private async getConnection(): Promise<ISpotifyConnection | null> {
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
    return connection;
  }

  async getStatus(): Promise<SpotifyConnectionStatus> {
    const connection = await this.getConnection();
    return {
      connected: !!connection?.refreshToken,
      spotifyUserId: connection?.userId ?? null,
      spotifyDisplayName: connection?.displayName ?? null,
      scope: connection?.scope ?? null,
    };
  }

  // ─── OAuth connect flow ─────────────────────────────────────────────────────

  getConnectUrl(): { url: string } {
    if (!this.spotifyClientId || !this.spotifyClientSecret) {
      throw new BadRequestException(
        'Spotify integration is not configured on this server',
      );
    }

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
    this.verifyState(state);

    const tokenData = await this.exchangeCodeForTokens(code);
    const profile = await this.fetchSpotifyProfile(tokenData.access_token);

    const connection: ISpotifyConnection = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token ?? null,
      expiresAt: new Date(
        Date.now() + tokenData.expires_in * 1000,
      ).toISOString(),
      scope: tokenData.scope ?? null,
      userId: profile.id,
      displayName: profile.display_name ?? null,
    };

    await this.usersRepository.update(this.user!.id, {
      spotify: connection,
    });

    return {
      connected: true,
      spotifyUserId: connection.userId,
      spotifyDisplayName: connection.displayName,
      scope: connection.scope,
    };
  }

  async disconnect(): Promise<SpotifyConnectionStatus> {
    await this.usersRepository.update(this.user!.id, {
      spotify: null,
    });

    return {
      connected: false,
      spotifyUserId: null,
      spotifyDisplayName: null,
      scope: null,
    };
  }

  // ─── Schedule playlist sync ─────────────────────────────────────────────────

  async syncSchedulePlaylist(
    orgId: number,
    scheduleId: number,
    dto: CreateSchedulePlaylistDto,
  ): Promise<SchedulePlaylistSyncResult> {
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
    const existingReference = (schedule.references ?? []).find(
      (reference): reference is SchedulePlaylistReference =>
        'source' in reference &&
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

    let playlistUrl: string;
    let action: 'created' | 'synced';

    if (existingReference) {
      action = 'synced';
      playlistUrl = existingReference.url;
      await this.replacePlaylistTracks(playlistUrl, projection.trackUris);

      existingReference.syncedAt = new Date().toISOString();
      existingReference.tracksHash = computeTracksHash(projection.trackIds);
    } else {
      action = 'created';
      const name =
        dto.name ?? this.defaultPlaylistName(schedule.title, schedule.date);
      playlistUrl = await this.createPlaylist(name);
      await this.replacePlaylistTracks(playlistUrl, projection.trackUris);

      schedule.references = [
        ...(schedule.references ?? []),
        {
          url: playlistUrl,
          name,
          source: SPOTIFY_AUTO_REFERENCE_SOURCE,
          syncedAt: new Date().toISOString(),
          tracksHash: computeTracksHash(projection.trackIds),
          syncedBy: this.user!.id,
          syncedByName: this.user!.nickname,
        },
      ];
    }

    await this.schedulesRepository.update(schedule.id, {
      references: schedule.references,
    });

    return {
      action,
      url: playlistUrl,
      added: projection.trackUris.length,
      skipped: projection.skipped,
    };
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

  private async createPlaylist(name: string): Promise<string> {
    const connection = await this.requireConnection();

    const playlist = await this.spotifyApi<{
      id: string;
      external_urls: { spotify: string };
    }>(`/users/${encodeURIComponent(connection.userId)}/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        public: false,
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

    // Spotify accepts up to 100 track uris per write request.
    const firstChunk = trackUris.slice(0, TRACKS_PER_REQUEST);
    await this.spotifyApi(
      `/playlists/${encodeURIComponent(playlistId)}/tracks`,
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
        `/playlists/${encodeURIComponent(playlistId)}/tracks`,
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
      if (!match) {
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

    if (response.status === 404) {
      throw new NotFoundException(
        'The Spotify playlist no longer exists. Remove the playlist reference to generate a new one.',
      );
    }
    if (response.status === 403) {
      throw new ForbiddenException(
        'The connected Spotify account can no longer modify this playlist.',
      );
    }
    throw new BadRequestException(`Spotify API error: ${body}`);
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

    const data = await this.requestToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refreshToken!,
        client_id: this.spotifyClientId!,
      }),
    );

    if (!data.access_token) {
      throw new UnauthorizedException(
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

    await this.usersRepository.update(this.user!.id, {
      spotify: updated,
    });

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
        throw new BadRequestException(
          'Spotify authorization is no longer valid. Please reconnect your account.',
        );
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
    return createHmac('sha256', secret!).update(payload).digest('base64url');
  }
}
