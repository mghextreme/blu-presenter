import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { Schedule, SchedulePlaylistReference, Song, User } from 'src/entities';
import {
  CreateSchedulePlaylistDto,
  IPlaylistConnection,
  IUserPlaylistIntegrationData,
  PlaylistConnectionStatus,
  SchedulePlaylistSyncResult,
} from 'src/types';
import {
  computeTracksHash,
  isAutoReference,
} from 'src/utils/schedule-references';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { fetchWithTimeout } from 'src/utils/fetch-with-timeout';

/** Providers with a playlist integration. Also the name of the users column
 * holding the connection and of the config section with its credentials. */
export type PlaylistIntegrationProvider = 'spotify' | 'youtube';

/** The connected account on the provider. */
export interface PlaylistAccountProfile {
  id: string;
  displayName: string | null;
}

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

interface OAuthState {
  /** Provider the state was issued for. */
  p: PlaylistIntegrationProvider;
  uid: number;
  exp: number;
}

interface ProjectionEntry {
  songId: number;
  title: string;
  itemId: string;
}

/**
 * The user a call acts for. Their stored connection is loaded at most once
 * per call and kept in sync with every write.
 */
export interface PlaylistUserContext {
  user: User;
  connection?: Promise<IUserPlaylistIntegrationData | null>;
}

/** Access tokens are considered stale this long before their real expiry. */
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

/** OAuth state lifetime. */
const STATE_TTL_MS = 10 * 60 * 1000;

/** The token endpoint rejected the refresh token (revoked or expired). */
class InvalidGrantException extends BadRequestException {
  constructor(serviceName: string) {
    super(
      `${serviceName} authorization is no longer valid. Please reconnect your account.`,
    );
  }
}

/**
 * Base for the integrations that turn a schedule into a playlist on a
 * streaming service (Spotify, YouTube). Implements the parts every provider
 * shares:
 *
 * - the per-user connection, stored in the provider's `users` jsonb column
 *   together with the database-managed `enabled` flag (only checked by
 *   providers that require opting in, see `requiresOptIn`);
 * - the OAuth authorization code flow (signed state, code exchange, token
 *   refresh with a retry on 401);
 * - the schedule sync: projecting songs to provider item ids, creating the
 *   playlist once and persisting it as an auto-generated schedule reference,
 *   then rewriting its items on every sync.
 *
 * Subclasses provide the endpoints and the provider-specific API calls.
 */
@Injectable()
export abstract class PlaylistIntegrationService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @Inject(ConfigService)
    protected readonly configService: ConfigService,
    @InjectRepository(User)
    protected readonly usersRepository: Repository<User>,
    @InjectRepository(Schedule)
    protected readonly schedulesRepository: Repository<Schedule>,
    @InjectRepository(Song)
    protected readonly songsRepository: Repository<Song>,
    @Inject(OrganizationsService)
    protected readonly organizationsService: OrganizationsService,
  ) {}

  // ─── Provider definition ────────────────────────────────────────────────────

  protected abstract readonly provider: PlaylistIntegrationProvider;
  /** `source` of the auto-generated schedule reference. */
  protected abstract readonly source: SchedulePlaylistReference['source'];
  /** Display name used in error messages. */
  protected abstract readonly serviceName: string;
  protected abstract readonly authorizeUrl: string;
  protected abstract readonly tokenUrl: string;
  protected abstract readonly apiBase: string;
  protected abstract readonly connectScopes: string[];

  /** Extra query parameters of the authorize URL. */
  protected extraAuthorizeParams(): Record<string, string> {
    return {};
  }

  protected abstract fetchAccountProfile(
    accessToken: string,
  ): Promise<PlaylistAccountProfile>;

  /** Extracts the provider's item id (track, video) from a song reference
   * URL, or null when the reference doesn't belong to the provider. */
  protected abstract getItemId(url: string): string | null;

  /** Creates an empty playlist and returns its URL. */
  protected abstract createPlaylist(
    context: PlaylistUserContext,
    name: string,
    isPublic: boolean,
  ): Promise<string>;

  /**
   * Makes the playlist contain exactly the given items, in order. Returns
   * the ids the provider refused to add (e.g. deleted videos); the songs
   * with those ids are reported as skipped. `isNew` is set when the playlist
   * was created by this same sync, so it is known to be empty.
   */
  protected abstract writePlaylistItems(
    context: PlaylistUserContext,
    playlistUrl: string,
    itemIds: string[],
    isNew: boolean,
  ): Promise<string[]>;

  /** Maps a failed API response to the exception thrown to the client. */
  protected abstract toApiException(
    status: number,
    body: string,
  ): HttpException;

  /** Revokes the grant on the provider when the user disconnects. Only
   * called with a stored refresh token; failures are logged and ignored. */
  protected async revokeToken(_connection: IPlaylistConnection): Promise<void> {
    // Not supported by every provider.
  }

  // ─── Configuration ──────────────────────────────────────────────────────────

  protected get clientId(): string | undefined {
    return this.configService.get(`${this.provider}.clientId`);
  }

  protected get clientSecret(): string | undefined {
    return this.configService.get(`${this.provider}.clientSecret`);
  }

  /** Whether the server has the credentials the API flow needs. */
  private get isConfigured(): boolean {
    return !!this.clientId && !!this.clientSecret;
  }

  /**
   * Whether users need the database-managed `enabled` flag before they can
   * connect. When false, every user can once the server is configured.
   */
  protected get requiresOptIn(): boolean {
    return true;
  }

  /** Whether the user may connect their account and create playlists. */
  private isPlaylistsEnabled(
    data: IUserPlaylistIntegrationData | null,
  ): boolean {
    if (!this.isConfigured) return false;
    return !this.requiresOptIn || data?.enabled === true;
  }

  private async assertPlaylistsEnabled(
    context: PlaylistUserContext,
  ): Promise<void> {
    if (!this.isConfigured) {
      throw new BadRequestException(
        `${this.serviceName} integration is not configured on this server`,
      );
    }
    if (!this.isPlaylistsEnabled(await this.getConnection(context))) {
      throw new ForbiddenException(
        `${this.serviceName} playlists are not enabled for this account`,
      );
    }
  }

  private get connectRedirectUri(): string {
    return (
      this.configService.get('app.baseUrl') +
      `/app/${this.provider}/connect-callback`
    );
  }

  // ─── Connection status ──────────────────────────────────────────────────────

  private getConnection(
    context: PlaylistUserContext,
  ): Promise<IUserPlaylistIntegrationData | null> {
    context.connection ??= this.loadConnection(context.user);
    return context.connection;
  }

  private async loadConnection(
    user: User,
  ): Promise<IUserPlaylistIntegrationData | null> {
    // Tokens are select:false on the entity — load them explicitly so they
    // can never leak through other code paths.
    const row = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect(`user.${this.provider}`)
      .where('user.id = :id', { id: user.id })
      .getOne();

    return row?.[this.provider] ?? null;
  }

  private async requireConnection(
    context: PlaylistUserContext,
  ): Promise<IPlaylistConnection> {
    const connection = await this.getConnection(context);
    if (!connection?.refreshToken) {
      throw new BadRequestException(
        `${this.serviceName} account not connected`,
      );
    }
    return connection as IPlaylistConnection;
  }

  async getStatus(user: User): Promise<PlaylistConnectionStatus> {
    return this.statusOf({ user });
  }

  private async statusOf(
    context: PlaylistUserContext,
  ): Promise<PlaylistConnectionStatus> {
    const connection = await this.getConnection(context);
    return {
      configured: this.isConfigured,
      playlistsEnabled: this.isPlaylistsEnabled(connection),
      connected: !!connection?.refreshToken,
      accountId: connection?.userId ?? null,
      accountName: connection?.displayName ?? null,
      scope: connection?.scope ?? null,
    };
  }

  // ─── OAuth connect flow ─────────────────────────────────────────────────────

  async getConnectUrl(user: User): Promise<{ url: string }> {
    // The API connection only exists to manage playlists.
    await this.assertPlaylistsEnabled({ user });

    const params = new URLSearchParams({
      client_id: this.clientId!,
      response_type: 'code',
      redirect_uri: this.connectRedirectUri,
      state: this.createState(user.id),
      scope: this.connectScopes.join(' '),
      ...this.extraAuthorizeParams(),
    });

    return { url: `${this.authorizeUrl}?${params.toString()}` };
  }

  async completeConnect(
    user: User,
    code: string,
    state: string,
  ): Promise<PlaylistConnectionStatus> {
    const context: PlaylistUserContext = { user };
    await this.assertPlaylistsEnabled(context);
    this.verifyState(state, user.id);

    const tokenData = await this.exchangeCodeForTokens(code);
    if (!tokenData.refresh_token) {
      // Without a refresh token the connection would expire within the hour
      // while still looking connected.
      throw new BadRequestException(
        `${this.serviceName} did not grant offline access. Please try connecting again.`,
      );
    }
    const profile = await this.fetchAccountProfile(tokenData.access_token);

    const connection: IPlaylistConnection = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(
        Date.now() + tokenData.expires_in * 1000,
      ).toISOString(),
      scope: tokenData.scope ?? null,
      userId: profile.id,
      displayName: profile.displayName,
    };

    await this.saveConnection(context, connection);

    return this.statusOf(context);
  }

  async disconnect(user: User): Promise<PlaylistConnectionStatus> {
    const context: PlaylistUserContext = { user };
    const connection = await this.getConnection(context);
    if (connection?.refreshToken) {
      try {
        await this.revokeToken(connection as IPlaylistConnection);
      } catch (e) {
        this.logger.warn(
          `Failed to revoke the ${this.serviceName} token: ${(e as Error).message}`,
        );
      }
    }

    await this.saveConnection(context, null);

    return this.statusOf(context);
  }

  /**
   * Stores (or, with null, clears) the connection tokens. The `enabled` flag
   * shares the column but is managed in the database, so it is carried over
   * from the stored value rather than taken from `connection`.
   */
  private async saveConnection(
    context: PlaylistUserContext,
    connection: IPlaylistConnection | null,
  ): Promise<void> {
    const enabled = (await this.getConnection(context))?.enabled === true;
    let data: IUserPlaylistIntegrationData | null = null;
    if (connection) {
      // Drop a stale flag that may ride along when spreading a loaded row.
      const { enabled: _stale, ...tokens } =
        connection as IUserPlaylistIntegrationData;
      data = tokens;
    }
    if (enabled) {
      data = { ...data, enabled: true };
    }

    await this.usersRepository.update(context.user.id, {
      [this.provider]: data,
    });
    context.connection = Promise.resolve(data);
  }

  // ─── Schedule playlist sync ─────────────────────────────────────────────────

  async syncSchedulePlaylist(
    user: User,
    orgId: number,
    scheduleId: number,
    dto: CreateSchedulePlaylistDto,
  ): Promise<SchedulePlaylistSyncResult> {
    const context: PlaylistUserContext = { user };
    await this.assertPlaylistsEnabled(context);

    const schedule = await this.schedulesRepository.findOneBy({
      id: scheduleId,
      orgId,
    });
    if (!schedule) {
      throw new NotFoundException();
    }

    await this.organizationsService.assertFeatureEnabled(orgId, 'schedules');

    const projection = await this.buildProjection(schedule.items);
    // Malformed entries (non-objects) are dropped on every write.
    const references = (schedule.references ?? []).filter(
      (reference) => !!reference && typeof reference === 'object',
    );
    const existingReference = references.find(
      (reference): reference is SchedulePlaylistReference =>
        isAutoReference(reference) && reference.source === this.source,
    );

    if (existingReference && existingReference.syncedBy !== user.id) {
      throw new ForbiddenException(
        'Only the creator of the playlist can re-sync it',
      );
    }

    if (projection.entries.length === 0) {
      throw new BadRequestException(
        `No songs in this schedule have a ${this.serviceName} reference`,
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
      const url = await this.createPlaylist(context, name, dto.public ?? false);

      // Persist the reference right away (still without a tracks hash, so it
      // shows as pending): if writing the items fails below, a retry
      // re-syncs this playlist instead of creating another empty one.
      reference = {
        url,
        name,
        source: this.source,
        syncedBy: user.id,
        // Persist as absent (key dropped on JSON serialization), not null —
        // the frontend schema treats null metadata as invalid input.
        ...(user.nickname != null && {
          syncedByName: user.nickname,
        }),
      };
      references.push(reference);
      await this.saveReferences(schedule.id, references);
    }

    const itemIds = projection.entries.map((entry) => entry.itemId);
    const failedIds = new Set(
      await this.writePlaylistItems(
        context,
        reference.url,
        itemIds,
        action === 'created',
      ),
    );
    const failed = projection.entries.filter((entry) =>
      failedIds.has(entry.itemId),
    );

    reference.syncedAt = new Date().toISOString();
    // Hash the full projection, refused items included: the frontend can't
    // know which items the provider refused, and would otherwise show the
    // playlist as out of date forever.
    reference.tracksHash = computeTracksHash(itemIds);
    delete reference.syncedByMe;
    await this.saveReferences(schedule.id, references);

    return {
      action,
      url: reference.url,
      added: projection.entries.length - failed.length,
      skipped: [
        ...projection.skipped,
        ...failed.map(({ songId, title }) => ({ songId, title })),
      ],
    };
  }

  /**
   * Detaches the auto-generated playlist from a schedule. The playlist
   * itself stays in its owner's library.
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

    await this.organizationsService.assertFeatureEnabled(orgId, 'schedules');

    const references = (schedule.references ?? []).filter(
      (reference) =>
        !!reference &&
        typeof reference === 'object' &&
        !(isAutoReference(reference) && reference.source === this.source),
    );
    await this.saveReferences(schedule.id, references);
  }

  private async saveReferences(
    scheduleId: number,
    references: Schedule['references'],
  ): Promise<void> {
    await this.schedulesRepository.update(scheduleId, { references });
  }

  /** Maps the schedule's songs, in order, to the provider's item ids. */
  private async buildProjection(items: any[]): Promise<{
    entries: ProjectionEntry[];
    skipped: { songId: number; title: string }[];
  }> {
    const songItems = (items ?? []).filter((item) => item.type === 'song');
    if (songItems.length === 0) {
      return { entries: [], skipped: [] };
    }

    const songIds = [...new Set(songItems.map((item) => item.id))];
    const songs = await this.songsRepository
      .createQueryBuilder('song')
      .select(['song.id', 'song.title', 'song.references'])
      .where('song.id IN (:...songIds)', { songIds })
      .getMany();

    const songsMap = new Map(songs.map((song) => [song.id, song]));

    const entries: ProjectionEntry[] = [];
    const skipped: { songId: number; title: string }[] = [];

    for (const item of songItems) {
      const song = songsMap.get(item.id);
      if (!song) {
        continue;
      }

      const itemId = (song.references ?? [])
        .map((reference) => this.getItemId(reference.url))
        .find((id) => id !== null);

      if (itemId) {
        entries.push({ songId: song.id, title: song.title, itemId });
      } else {
        skipped.push({ songId: song.id, title: song.title });
      }
    }

    return { entries, skipped };
  }

  private defaultPlaylistName(title: string, date: string | null): string {
    return date ? `${title} — ${date}` : title;
  }

  // ─── API access with automatic token refresh ────────────────────────────────

  /**
   * Calls the provider's API (`path` is relative to `apiBase`) with a valid
   * access token, refreshing it first when it is stale and once more when
   * the API rejects it. Failed responses go through `toApiException`.
   */
  protected async apiRequest<T = unknown>(
    context: PlaylistUserContext,
    path: string,
    init: RequestInit = {},
    allowRefreshRetry: boolean = true,
    overrideAccessToken?: string,
  ): Promise<T> {
    let accessToken = overrideAccessToken;
    if (!accessToken) {
      const connection = await this.requireConnection(context);
      accessToken = await this.getValidAccessToken(context, connection);
    }

    const response = await fetchWithTimeout(`${this.apiBase}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers ?? {}),
      },
    });

    if (response.status === 401 && allowRefreshRetry) {
      // The cached access token was rejected (e.g. revoked server-side).
      // Force a refresh and retry once.
      const connection = await this.requireConnection(context);
      const refreshedAccessToken = await this.refreshAccessToken(
        context,
        connection,
        true,
      );
      return this.apiRequest<T>(
        context,
        path,
        init,
        false,
        refreshedAccessToken,
      );
    }

    if (!response.ok) {
      throw this.toApiException(response.status, await response.text());
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private isTokenValid(connection: IPlaylistConnection): boolean {
    return (
      !!connection.accessToken &&
      new Date(connection.expiresAt).getTime() >
        Date.now() + TOKEN_EXPIRY_MARGIN_MS
    );
  }

  private async getValidAccessToken(
    context: PlaylistUserContext,
    connection: IPlaylistConnection,
  ): Promise<string> {
    if (this.isTokenValid(connection)) {
      return connection.accessToken;
    }
    return this.refreshAccessToken(context, connection, false);
  }

  /**
   * Refreshes the access token using the stored refresh token and persists
   * the updated connection. Providers may rotate refresh tokens, so the
   * returned refresh token (if any) always replaces the stored one. With
   * `force`, a still-valid cached token is bypassed.
   */
  private async refreshAccessToken(
    context: PlaylistUserContext,
    connection: IPlaylistConnection,
    force: boolean,
  ): Promise<string> {
    if (!force && this.isTokenValid(connection)) {
      return connection.accessToken;
    }

    let data: OAuthTokenResponse;
    try {
      data = await this.requestToken(
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refreshToken!,
          // The refresh token was issued through the (non-PKCE) Authorization
          // Code flow, so the token endpoint requires the client credentials.
          client_id: this.clientId!,
          client_secret: this.clientSecret!,
        }),
      );
    } catch (e) {
      if (e instanceof InvalidGrantException) {
        // The refresh token is dead: drop the connection so the UI asks the
        // user to reconnect instead of offering syncs that always fail.
        await this.saveConnection(context, null);
      }
      throw e;
    }

    if (!data.access_token) {
      throw new InvalidGrantException(this.serviceName);
    }

    const updated: IPlaylistConnection = {
      ...connection,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? connection.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      scope: data.scope ?? connection.scope,
    };

    await this.saveConnection(context, updated);

    return updated.accessToken;
  }

  // ─── Token endpoint helpers ─────────────────────────────────────────────────

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<OAuthTokenResponse> {
    return this.requestToken(
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.connectRedirectUri,
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
      }),
    );
  }

  private async requestToken(
    body: URLSearchParams,
  ): Promise<OAuthTokenResponse> {
    let response: Response;
    try {
      response = await fetchWithTimeout(this.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      throw new BadRequestException(`Failed to reach ${this.serviceName}`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      if (errorBody.includes('invalid_grant')) {
        throw new InvalidGrantException(this.serviceName);
      }
      throw new BadRequestException(
        `${this.serviceName} token error: ${errorBody}`,
      );
    }

    return (await response.json()) as OAuthTokenResponse;
  }

  // ─── OAuth state signing (CSRF protection) ──────────────────────────────────

  private createState(userId: number): string {
    const payload = Buffer.from(
      JSON.stringify({
        p: this.provider,
        uid: userId,
        exp: Date.now() + STATE_TTL_MS,
      } satisfies OAuthState),
    ).toString('base64url');

    return `${payload}.${this.signStatePayload(payload)}`;
  }

  private verifyState(state: string, userId: number): void {
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

    let data: OAuthState;
    try {
      data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch {
      throw new BadRequestException('Invalid OAuth state');
    }

    if (data.p !== this.provider || data.uid !== userId) {
      throw new BadRequestException('Invalid OAuth state');
    }
    if (!data.exp || data.exp < Date.now()) {
      throw new BadRequestException('OAuth state expired, please try again');
    }
  }

  private signStatePayload(payload: string): string {
    const secret = this.configService.get(`${this.provider}.stateSecret`);
    if (!secret) {
      // Reaching here means the integration is not configured (the connect
      // URL endpoint already guards on clientId/secret, but completeConnect
      // can also arrive here on its own).
      throw new BadRequestException(
        `${this.serviceName} integration is not configured on this server`,
      );
    }
    return createHmac('sha256', secret).update(payload).digest('base64url');
  }
}
