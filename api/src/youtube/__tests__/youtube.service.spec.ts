import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { createHmac } from 'node:crypto';
import { YoutubeService } from '../youtube.service';
import { Schedule, Song, User } from '../../entities';
import { IPlaylistConnection } from '../../types/playlist-connection.interface';
import { computeTracksHash } from '../../utils/schedule-references';
import { OrganizationsBaseService } from '../../organizations/organizations.service';

const API = 'https://www.googleapis.com/youtube/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PL1';

describe('YoutubeService', () => {
  let service: YoutubeService;

  const STATE_SECRET = 'test-state-secret';
  const CLIENT_ID = 'yt-client-id';
  const CLIENT_SECRET = 'yt-client-secret';

  /** The current user's youtube jsonb column (`undefined`: no user row). */
  let storedConnection: IPlaylistConnection | null | undefined;
  let youtubeEnabled: boolean;

  const storedRow = () => {
    if (storedConnection === undefined) return null;
    if (!youtubeEnabled) return { id: 42, youtube: storedConnection };
    return { id: 42, youtube: { ...storedConnection, enabled: true } };
  };

  const validConnection = (): IPlaylistConnection => ({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    scope: 'https://www.googleapis.com/auth/youtube',
    userId: 'UC-channel-1',
    displayName: 'Matias Channel',
  });

  const usersUpdate = jest.fn();
  const scheduleFindOneBy = jest.fn();
  const scheduleUpdate = jest.fn();
  const songsQueryBuilder = jest.fn();

  const buildModule = async (
    configOverrides: Record<string, any> = {},
  ): Promise<TestingModule> =>
    Test.createTestingModule({
      providers: [
        YoutubeService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({
                'youtube.clientId': CLIENT_ID,
                'youtube.clientSecret': CLIENT_SECRET,
                'youtube.stateSecret': STATE_SECRET,
                'app.baseUrl': 'https://app.blu.example',
                ...configOverrides,
              })[key],
          },
        },
        {
          provide: REQUEST,
          useValue: {
            user: {
              internal: { id: 42, nickname: 'Matias' },
              organization: 1,
            },
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            update: usersUpdate,
            createQueryBuilder: () => ({
              addSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue(storedRow()),
            }),
          },
        },
        {
          provide: getRepositoryToken(Schedule),
          useValue: { findOneBy: scheduleFindOneBy, update: scheduleUpdate },
        },
        {
          provide: getRepositoryToken(Song),
          useValue: { createQueryBuilder: songsQueryBuilder },
        },
        {
          provide: OrganizationsBaseService,
          useValue: {
            assertFeatureEnabled: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

  const signStatePayload = (payload: string): string =>
    createHmac('sha256', STATE_SECRET).update(payload).digest('base64url');

  const makeState = (uid: number, exp: number, p = 'youtube'): string => {
    const payload = Buffer.from(JSON.stringify({ p, uid, exp })).toString(
      'base64url',
    );
    return `${payload}.${signStatePayload(payload)}`;
  };

  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  const apiError = (status: number, reason: string, message = reason) =>
    jsonResponse(
      { error: { code: status, message, errors: [{ reason, message }] } },
      status,
    );

  // ─── Fake YouTube API ───────────────────────────────────────────────────────

  /** Items of the fake playlist PL1, in order. */
  let playlist: { id: string; videoId: string }[];
  let nextItemId: number;
  /** Videos the fake API refuses to insert (deleted videos). */
  let missingVideos: Set<string>;
  /** Response overrides by `METHOD path` prefix, checked before the fake. */
  let overrides: Map<string, () => Response>;
  let pageSize: number;

  const calls: { method: string; url: string; body?: any }[] = [];
  const writes = () =>
    calls.filter(
      (call) =>
        call.url.startsWith(`${API}/playlistItems`) && call.method !== 'GET',
    );

  const fakeFetch = async (input: any, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    let body: any = init?.body;
    if (typeof body === 'string') body = JSON.parse(body);
    calls.push({ method, url, body });

    for (const [key, respond] of overrides) {
      if (`${method} ${url}`.startsWith(key)) return respond();
    }

    const parsed = new URL(url);
    const path = parsed.origin + parsed.pathname;

    if (path === `${API}/playlists` && method === 'POST') {
      return jsonResponse({ id: 'PL1' });
    }
    if (path === `${API}/playlistItems` && method === 'GET') {
      const start = Number(parsed.searchParams.get('pageToken') ?? 0);
      const page = playlist.slice(start, start + pageSize);
      return jsonResponse({
        items: page.map((item) => ({
          id: item.id,
          contentDetails: { videoId: item.videoId },
        })),
        ...(start + pageSize < playlist.length && {
          nextPageToken: String(start + pageSize),
        }),
      });
    }
    if (path === `${API}/playlistItems` && method === 'DELETE') {
      const id = parsed.searchParams.get('id');
      playlist = playlist.filter((item) => item.id !== id);
      return new Response(null, { status: 204 });
    }
    if (path === `${API}/playlistItems` && method === 'POST') {
      const videoId = body.snippet.resourceId.videoId;
      if (missingVideos.has(videoId)) {
        return apiError(404, 'videoNotFound');
      }
      const item = { id: `item-${nextItemId++}`, videoId };
      playlist.push(item);
      return jsonResponse({ id: item.id });
    }
    throw new Error(`Unexpected fetch call: ${method} ${url}`);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    calls.length = 0;
    storedConnection = validConnection();
    youtubeEnabled = true;
    playlist = [];
    nextItemId = 1;
    missingVideos = new Set();
    overrides = new Map();
    pageSize = 50;

    jest.spyOn(globalThis, 'fetch').mockImplementation(fakeFetch);

    const module = await buildModule();
    service = await module.resolve<YoutubeService>(YoutubeService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getStatus', () => {
    it('reports the connected channel', async () => {
      expect(await service.getStatus()).toEqual({
        configured: true,
        playlistsEnabled: true,
        connected: true,
        accountId: 'UC-channel-1',
        accountName: 'Matias Channel',
        scope: 'https://www.googleapis.com/auth/youtube',
      });
    });

    it('reports playlists enabled without a per-user flag', async () => {
      youtubeEnabled = false;
      storedConnection = null;
      expect(await service.getStatus()).toMatchObject({
        configured: true,
        playlistsEnabled: true,
        connected: false,
      });
    });

    it('reports not configured without credentials', async () => {
      const module = await buildModule({ 'youtube.clientId': undefined });
      const unconfigured = await module.resolve<YoutubeService>(YoutubeService);

      expect(await unconfigured.getStatus()).toMatchObject({
        configured: false,
        playlistsEnabled: false,
      });
    });
  });

  describe('getConnectUrl', () => {
    it('requests offline access to YouTube with a signed state', async () => {
      const { url } = await service.getConnectUrl();
      const parsed = new URL(url);

      expect(parsed.origin + parsed.pathname).toBe(
        'https://accounts.google.com/o/oauth2/v2/auth',
      );
      expect(parsed.searchParams.get('client_id')).toBe(CLIENT_ID);
      expect(parsed.searchParams.get('redirect_uri')).toBe(
        'https://app.blu.example/app/youtube/connect-callback',
      );
      expect(parsed.searchParams.get('scope')).toBe(
        'https://www.googleapis.com/auth/youtube',
      );
      expect(parsed.searchParams.get('access_type')).toBe('offline');
      expect(parsed.searchParams.get('prompt')).toBe('consent');

      const [payload, signature] = parsed.searchParams.get('state')!.split('.');
      expect(signStatePayload(payload)).toBe(signature);
      expect(
        JSON.parse(Buffer.from(payload, 'base64url').toString()),
      ).toMatchObject({ p: 'youtube', uid: 42 });
    });

    it('allows users without the enabled flag', async () => {
      youtubeEnabled = false;
      storedConnection = null;
      await expect(service.getConnectUrl()).resolves.toHaveProperty('url');
    });

    it('refuses when the server is not configured', async () => {
      const module = await buildModule({ 'youtube.clientSecret': undefined });
      const unconfigured = await module.resolve<YoutubeService>(YoutubeService);

      await expect(unconfigured.getConnectUrl()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeConnect', () => {
    const tokenResponse = () =>
      jsonResponse({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        expires_in: 3600,
        scope: 'https://www.googleapis.com/auth/youtube',
      });

    it('stores the connection with the channel as the account', async () => {
      overrides.set(`POST ${TOKEN_URL}`, tokenResponse);
      overrides.set(`GET ${API}/channels`, () =>
        jsonResponse({
          items: [{ id: 'UC-new', snippet: { title: 'New Channel' } }],
        }),
      );

      const status = await service.completeConnect(
        'code',
        makeState(42, Date.now() + 60_000),
      );

      expect(status).toMatchObject({
        connected: true,
        accountId: 'UC-new',
        accountName: 'New Channel',
      });
      expect(usersUpdate).toHaveBeenCalledWith(42, {
        youtube: expect.objectContaining({
          enabled: true,
          refreshToken: 'new-refresh',
          userId: 'UC-new',
        }),
      });
      const tokenCall = calls.find((call) => call.url === TOKEN_URL)!;
      expect(String(tokenCall.body)).toContain('grant_type=authorization_code');
    });

    it('rejects accounts without a YouTube channel', async () => {
      overrides.set(`POST ${TOKEN_URL}`, tokenResponse);
      overrides.set(`GET ${API}/channels`, () => jsonResponse({ items: [] }));

      await expect(
        service.completeConnect('code', makeState(42, Date.now() + 60_000)),
      ).rejects.toThrow(/no YouTube channel/);
      expect(usersUpdate).not.toHaveBeenCalled();
    });

    it('rejects a state issued for another provider', async () => {
      await expect(
        service.completeConnect(
          'code',
          makeState(42, Date.now() + 60_000, 'spotify'),
        ),
      ).rejects.toThrow(BadRequestException);
      expect(calls).toHaveLength(0);
    });
  });

  describe('disconnect', () => {
    it('revokes the grant and keeps the enabled flag', async () => {
      overrides.set(`POST ${REVOKE_URL}`, () => new Response(null));

      const status = await service.disconnect();

      expect(status).toMatchObject({
        connected: false,
        playlistsEnabled: true,
      });
      expect(usersUpdate).toHaveBeenCalledWith(42, {
        youtube: { enabled: true },
      });
      const revoke = calls.find((call) => call.url === REVOKE_URL)!;
      expect(String(revoke.body)).toBe('token=refresh-token');
    });

    it('still disconnects when revoking fails', async () => {
      overrides.set(`POST ${REVOKE_URL}`, () => {
        throw new Error('network down');
      });
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      await service.disconnect();

      expect(usersUpdate).toHaveBeenCalledWith(42, {
        youtube: { enabled: true },
      });
    });
  });

  describe('syncSchedulePlaylist', () => {
    const video = (id: string) => `https://www.youtube.com/watch?v=${id}`;

    const mockSchedule = (
      songIds: number[],
      references: any[] = [],
    ): Schedule =>
      ({
        id: 1,
        orgId: 1,
        title: 'Sunday Service',
        date: '2026-11-15',
        items: songIds.map((id) => ({ type: 'song', id })),
        references,
      }) as Schedule;

    /** Songs 1..n, each referencing video `v<n>` (plus a Spotify link). */
    const mockSongs = (
      count: number,
      overridesById: Record<number, any> = {},
    ) =>
      songsQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(
          Array.from({ length: count }, (_, ix) => ({
            id: ix + 1,
            title: `Song ${ix + 1}`,
            references: [
              { url: 'https://open.spotify.com/track/abc' },
              { url: video(`v${ix + 1}`) },
            ],
            ...overridesById[ix + 1],
          })),
        ),
      });

    const existingReference = {
      url: PLAYLIST_URL,
      name: 'Sunday Service — 2026-11-15',
      source: 'youtube-auto',
      syncedBy: 42,
      syncedByName: 'Matias',
      tracksHash: 'old',
    };

    const seedPlaylist = (videoIds: string[]) => {
      playlist = videoIds.map((videoId) => ({
        id: `item-${nextItemId++}`,
        videoId,
      }));
    };

    it('creates an unlisted playlist and attaches a youtube-auto reference', async () => {
      scheduleFindOneBy.mockResolvedValue(mockSchedule([1, 2]));
      mockSongs(2);
      // The service mutates the persisted array: snapshot every write.
      const persisted: { references: any[]; itemsBefore: number }[] = [];
      scheduleUpdate.mockImplementation((_id, data) => {
        persisted.push({
          references: structuredClone(data.references),
          itemsBefore: playlist.length,
        });
      });

      const result = await service.syncSchedulePlaylist(1, 1, {});

      expect(result).toEqual({
        action: 'created',
        url: PLAYLIST_URL,
        added: 2,
        skipped: [],
      });

      const create = calls.find((call) => call.url.includes('/playlists?'))!;
      expect(create.url).toBe(`${API}/playlists?part=snippet,status`);
      expect(create.body).toEqual({
        snippet: {
          title: 'Sunday Service — 2026-11-15',
          description: 'Generated by BluPresenter',
        },
        status: { privacyStatus: 'unlisted' },
      });
      expect(playlist.map((item) => item.videoId)).toEqual(['v1', 'v2']);

      // Persisted once before writing items (pending), then with the hash.
      expect(persisted).toHaveLength(2);
      expect(persisted[0].itemsBefore).toBe(0);
      expect(persisted[0].references[0]).toMatchObject({
        url: PLAYLIST_URL,
        source: 'youtube-auto',
      });
      expect(persisted[0].references[0].tracksHash).toBeUndefined();
      expect(persisted[1].references).toEqual([
        expect.objectContaining({
          url: PLAYLIST_URL,
          source: 'youtube-auto',
          syncedBy: 42,
          tracksHash: computeTracksHash(['v1', 'v2']),
        }),
      ]);
    });

    it('creates a public playlist when asked, truncating long names', async () => {
      scheduleFindOneBy.mockResolvedValue(mockSchedule([1]));
      mockSongs(1);

      await service.syncSchedulePlaylist(1, 1, {
        name: 'x'.repeat(200),
        public: true,
      });

      const create = calls.find((call) => call.url.includes('/playlists?'))!;
      expect(create.body.status.privacyStatus).toBe('public');
      expect(create.body.snippet.title).toHaveLength(150);
    });

    describe('right after creating the playlist', () => {
      // YouTube can answer 404 for a playlist created moments ago.
      const playlistNotFound = () => apiError(404, 'playlistNotFound');
      let sleep: jest.SpyInstance;

      beforeEach(() => {
        scheduleFindOneBy.mockResolvedValue(mockSchedule([1, 2]));
        mockSongs(2);
        sleep = jest
          .spyOn(service as any, 'sleep')
          .mockResolvedValue(undefined);
      });

      it('does not list the items of the new playlist', async () => {
        overrides.set(`GET ${API}/playlistItems`, playlistNotFound);

        const result = await service.syncSchedulePlaylist(1, 1, {});

        expect(result).toMatchObject({ action: 'created', added: 2 });
        expect(
          calls.some(
            (call) =>
              call.method === 'GET' && call.url.includes('/playlistItems'),
          ),
        ).toBe(false);
        expect(playlist.map((item) => item.videoId)).toEqual(['v1', 'v2']);
      });

      it('retries the first insert until the playlist is visible', async () => {
        let notFoundLeft = 2;
        overrides.set(`POST ${API}/playlistItems`, () => {
          if (--notFoundLeft === 0) {
            overrides.delete(`POST ${API}/playlistItems`);
          }
          return playlistNotFound();
        });

        const result = await service.syncSchedulePlaylist(1, 1, {});

        expect(result).toMatchObject({ action: 'created', added: 2 });
        expect(sleep.mock.calls).toEqual([[1000], [2000]]);
        expect(playlist.map((item) => item.videoId)).toEqual(['v1', 'v2']);
      });

      it('gives up after a few retries, keeping the pending reference', async () => {
        overrides.set(`POST ${API}/playlistItems`, playlistNotFound);

        await expect(service.syncSchedulePlaylist(1, 1, {})).rejects.toThrow(
          NotFoundException,
        );
        expect(sleep).toHaveBeenCalledTimes(3);
        expect(scheduleUpdate).toHaveBeenCalledTimes(1);
      });
    });

    it('does not retry a missing playlist on re-sync', async () => {
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule([1], [existingReference]),
      );
      mockSongs(1);
      const sleep = jest.spyOn(service as any, 'sleep');
      overrides.set(`GET ${API}/playlistItems`, () =>
        apiError(404, 'playlistNotFound'),
      );

      await expect(service.syncSchedulePlaylist(1, 1, {})).rejects.toThrow(
        NotFoundException,
      );
      expect(sleep).not.toHaveBeenCalled();
    });

    it('makes no writes when the playlist is already up to date', async () => {
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule([1, 2, 3], [existingReference]),
      );
      mockSongs(3);
      seedPlaylist(['v1', 'v2', 'v3']);

      const result = await service.syncSchedulePlaylist(1, 1, {});

      expect(result.action).toBe('synced');
      expect(writes()).toHaveLength(0);
    });

    it('only inserts a song appended to the schedule', async () => {
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule([1, 2, 3], [existingReference]),
      );
      mockSongs(3);
      seedPlaylist(['v1', 'v2']);

      await service.syncSchedulePlaylist(1, 1, {});

      expect(writes()).toEqual([
        expect.objectContaining({
          method: 'POST',
          body: {
            snippet: {
              playlistId: 'PL1',
              resourceId: { kind: 'youtube#video', videoId: 'v3' },
            },
          },
        }),
      ]);
      expect(playlist.map((item) => item.videoId)).toEqual(['v1', 'v2', 'v3']);
    });

    it('rewrites everything after the first difference', async () => {
      // Schedule: 1, 3, 2 — playlist: 1, 2, 3, 4
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule([1, 3, 2], [existingReference]),
      );
      mockSongs(3);
      seedPlaylist(['v1', 'v2', 'v3', 'v4']);

      await service.syncSchedulePlaylist(1, 1, {});

      const methods = writes().map((call) => call.method);
      expect(methods).toEqual(['DELETE', 'DELETE', 'DELETE', 'POST', 'POST']);
      expect(playlist.map((item) => item.videoId)).toEqual(['v1', 'v3', 'v2']);
    });

    it('reads every page of the current playlist', async () => {
      pageSize = 2;
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule([1, 2, 3, 4, 5], [existingReference]),
      );
      mockSongs(5);
      seedPlaylist(['v1', 'v2', 'v3', 'v4', 'v5']);

      await service.syncSchedulePlaylist(1, 1, {});

      const listCalls = calls.filter(
        (call) => call.method === 'GET' && call.url.includes('/playlistItems'),
      );
      expect(listCalls).toHaveLength(3);
      expect(writes()).toHaveLength(0);
    });

    it('reports videos YouTube refuses as skipped, keeping the full hash', async () => {
      scheduleFindOneBy.mockResolvedValue(mockSchedule([1, 2, 3]));
      mockSongs(3, {
        3: { references: [{ url: 'https://open.spotify.com/track/abc' }] },
      });
      missingVideos.add('v2');

      const result = await service.syncSchedulePlaylist(1, 1, {});

      expect(result.added).toBe(1);
      expect(result.skipped).toEqual([
        { songId: 3, title: 'Song 3' },
        { songId: 2, title: 'Song 2' },
      ]);
      expect(playlist.map((item) => item.videoId)).toEqual(['v1']);
      expect(scheduleUpdate).toHaveBeenLastCalledWith(1, {
        references: [
          expect.objectContaining({
            tracksHash: computeTracksHash(['v1', 'v2']),
          }),
        ],
      });
    });

    it('refuses to re-sync a playlist created by someone else', async () => {
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule([1], [{ ...existingReference, syncedBy: 7 }]),
      );
      mockSongs(1);

      await expect(service.syncSchedulePlaylist(1, 1, {})).rejects.toThrow(
        ForbiddenException,
      );
      expect(calls).toHaveLength(0);
    });

    it('fails when no song has a YouTube reference', async () => {
      scheduleFindOneBy.mockResolvedValue(mockSchedule([1]));
      mockSongs(1, { 1: { references: [] } });

      await expect(service.syncSchedulePlaylist(1, 1, {})).rejects.toThrow(
        /No songs in this schedule have a YouTube reference/,
      );
    });

    it('surfaces an exceeded quota as 429', async () => {
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule([1], [existingReference]),
      );
      mockSongs(1);
      overrides.set(`GET ${API}/playlistItems`, () =>
        apiError(403, 'quotaExceeded'),
      );

      const error = await service
        .syncSchedulePlaylist(1, 1, {})
        .catch((e) => e);

      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(429);
      expect(error.message).toMatch(/quota/);
    });

    it('reports a deleted playlist', async () => {
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule([1], [existingReference]),
      );
      mockSongs(1);
      overrides.set(`GET ${API}/playlistItems`, () =>
        apiError(404, 'playlistNotFound'),
      );

      await expect(service.syncSchedulePlaylist(1, 1, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refreshes a rejected access token and retries once', async () => {
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule([1], [existingReference]),
      );
      mockSongs(1);
      seedPlaylist(['v1']);
      let rejected = false;
      overrides.set(`GET ${API}/playlistItems`, () => {
        if (rejected) {
          overrides.delete(`GET ${API}/playlistItems`);
          return jsonResponse({
            items: [{ id: 'item-1', contentDetails: { videoId: 'v1' } }],
          });
        }
        rejected = true;
        return new Response('unauthorized', { status: 401 });
      });
      overrides.set(`POST ${TOKEN_URL}`, () =>
        jsonResponse({ access_token: 'fresh', expires_in: 3600 }),
      );

      await service.syncSchedulePlaylist(1, 1, {});

      expect(usersUpdate).toHaveBeenCalledWith(42, {
        youtube: expect.objectContaining({
          accessToken: 'fresh',
          refreshToken: 'refresh-token',
          enabled: true,
        }),
      });
    });

    it('drops the connection when the refresh token was revoked', async () => {
      storedConnection = {
        ...validConnection(),
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule([1], [existingReference]),
      );
      mockSongs(1);
      overrides.set(
        `POST ${TOKEN_URL}`,
        () => new Response('{"error":"invalid_grant"}', { status: 400 }),
      );

      await expect(service.syncSchedulePlaylist(1, 1, {})).rejects.toThrow(
        /no longer valid/,
      );
      expect(usersUpdate).toHaveBeenCalledWith(42, {
        youtube: { enabled: true },
      });
    });
  });

  describe('removeSchedulePlaylist', () => {
    it('detaches only the YouTube playlist', async () => {
      const spotifyRef = {
        url: 'https://open.spotify.com/playlist/sp1',
        source: 'spotify-auto',
        syncedBy: 42,
      };
      scheduleFindOneBy.mockResolvedValue({
        id: 1,
        orgId: 1,
        references: [
          { url: PLAYLIST_URL, source: 'youtube-auto', syncedBy: 42 },
          spotifyRef,
          { url: 'https://example.com' },
        ],
      });

      await service.removeSchedulePlaylist(1, 1);

      expect(scheduleUpdate).toHaveBeenCalledWith(1, {
        references: [spotifyRef, { url: 'https://example.com' }],
      });
      expect(calls).toHaveLength(0);
    });
  });
});
