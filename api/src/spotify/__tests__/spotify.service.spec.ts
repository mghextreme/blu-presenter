import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { createHmac } from 'node:crypto';
import { SpotifyService } from '../spotify.service';
import { Schedule, Song, User } from '../../entities';
import { ISpotifyConnection } from '../../types/spotify-connection.interface';
import { computeTracksHash } from '../../utils/spotify';
import { OrganizationsBaseService } from '../../organizations/organizations.service';

describe('SpotifyService', () => {
  let service: SpotifyService;

  const STATE_SECRET = 'test-state-secret';
  const CLIENT_ID = 'client-id';
  const CLIENT_SECRET = 'client-secret';

  /**
   * What the "database" holds for the current user's spotify jsonb column.
   * `undefined` simulates a missing user row.
   */
  let storedConnection: ISpotifyConnection | null | undefined;

  const validConnection = (): ISpotifyConnection => ({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    scope: 'user-read-email',
    userId: 'sp-user-1',
    displayName: 'Matias S.',
  });

  const expiredConnection = (): ISpotifyConnection => ({
    ...validConnection(),
    accessToken: 'stale-access-token',
    expiresAt: new Date(Date.now() - 1000).toISOString(),
  });

  const buildModule = async (): Promise<TestingModule> => {
    const usersRepositoryMock = {
      update: usersUpdate,
      createQueryBuilder: () => ({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValue(
            storedConnection === undefined
              ? null
              : { id: 42, spotify: storedConnection },
          ),
      }),
    };

    return Test.createTestingModule({
      providers: [
        SpotifyService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              ({
                'spotify.clientId': CLIENT_ID,
                'spotify.clientSecret': CLIENT_SECRET,
                'spotify.stateSecret': STATE_SECRET,
                'app.baseUrl': 'https://app.blu.example',
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
        { provide: getRepositoryToken(User), useValue: usersRepositoryMock },
        {
          provide: getRepositoryToken(Schedule),
          useValue: {
            findOneBy: scheduleFindOneBy,
            update: scheduleUpdate,
          },
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
  };

  const signStatePayload = (payload: string): string =>
    createHmac('sha256', STATE_SECRET).update(payload).digest('base64url');

  const makeState = (uid: number, exp: number): string => {
    const payload = Buffer.from(JSON.stringify({ uid, exp })).toString(
      'base64url',
    );
    return `${payload}.${signStatePayload(payload)}`;
  };

  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  const usersUpdate = jest.fn();
  const scheduleFindOneBy = jest.fn();
  const scheduleUpdate = jest.fn();
  const songsQueryBuilder = jest.fn();

  const fetchCalls = (): [string, RequestInit][] =>
    (globalThis.fetch as jest.Mock).mock.calls as [string, RequestInit][];

  let fetchMock: jest.SpyInstance<
    Promise<Response>,
    [input: string | URL | Request, init?: RequestInit]
  >;

  beforeEach(async () => {
    storedConnection = validConnection();

    fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (url: any, _init?: any) => {
        throw new Error(`Unexpected fetch call: ${url}`);
      });

    const module = await buildModule();
    service = await module.resolve<SpotifyService>(SpotifyService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getStatus', () => {
    it('reports connected when a refresh token exists', async () => {
      expect(await service.getStatus()).toEqual({
        connected: true,
        spotifyUserId: 'sp-user-1',
        spotifyDisplayName: 'Matias S.',
        scope: 'user-read-email',
      });
    });

    it('reports not connected for users without Spotify data', async () => {
      storedConnection = null;

      expect((await service.getStatus()).connected).toBe(false);
    });
  });

  describe('getConnectUrl', () => {
    it('builds an authorize URL with scopes and signed state', () => {
      const { url } = service.getConnectUrl();
      const parsed = new URL(url);

      expect(parsed.toString()).toMatch(
        /^https:\/\/accounts\.spotify\.com\/authorize/,
      );
      expect(parsed.searchParams.get('client_id')).toBe(CLIENT_ID);
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('redirect_uri')).toBe(
        'https://app.blu.example/app/spotify/connect-callback',
      );
      expect(parsed.searchParams.get('scope')).toContain(
        'playlist-modify-private',
      );

      const state = parsed.searchParams.get('state')!;
      const [payload, signature] = state.split('.');
      expect(signStatePayload(payload)).toBe(signature);
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
      expect(data.uid).toBe(42);
      expect(data.exp).toBeGreaterThan(Date.now());
    });

    it('builds an authorize URL even when not connected (connecting!)', () => {
      storedConnection = null;
      expect(() => service.getConnectUrl()).not.toThrow();
    });
  });

  describe('completeConnect', () => {
    it('exchanges the code, stores the connection and returns the status', async () => {
      const state = makeState(42, Date.now() + 60_000);

      fetchMock
        .mockImplementationOnce(async () =>
          jsonResponse({
            access_token: 'new-access',
            refresh_token: 'new-refresh',
            expires_in: 3600,
            scope: 'playlist-modify-private',
          }),
        )
        .mockImplementationOnce(async () =>
          jsonResponse({ id: 'sp-user-9', display_name: 'Matias Spotify' }),
        );

      const status = await service.completeConnect('auth-code', state);

      expect(status.connected).toBe(true);
      expect(status.spotifyUserId).toBe('sp-user-9');
      expect(status.spotifyDisplayName).toBe('Matias Spotify');

      expect(usersUpdate).toHaveBeenCalledWith(42, {
        spotify: expect.objectContaining({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          userId: 'sp-user-9',
          displayName: 'Matias Spotify',
          scope: 'playlist-modify-private',
        }),
      });
    });

    it('rejects a tampered state', async () => {
      await expect(
        service.completeConnect('code', 'tampered.state'),
      ).rejects.toThrow(BadRequestException);
      expect(fetchCalls()).toHaveLength(0);
    });

    it('rejects a state issued for a different user', async () => {
      const state = makeState(999, Date.now() + 60_000);
      await expect(service.completeConnect('code', state)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an expired state', async () => {
      const state = makeState(42, Date.now() - 1000);
      await expect(service.completeConnect('code', state)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('disconnect', () => {
    it('clears the connection', async () => {
      const status = await service.disconnect();

      expect(status.connected).toBe(false);
      expect(usersUpdate).toHaveBeenCalledWith(42, { spotify: null });
    });
  });

  describe('syncSchedulePlaylist', () => {
    const mockSchedule = (overrides: Partial<Schedule> = {}): Schedule =>
      ({
        id: 1,
        orgId: 1,
        title: 'Sunday Service',
        date: '2026-11-15',
        items: [
          { type: 'song', id: 10 },
          { type: 'text', title: 'Announcements' },
          { type: 'song', id: 11 },
        ],
        references: [],
        ...overrides,
      }) as Schedule;

    const mockSongs = (songs: Partial<Song>[]) => {
      songsQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(songs),
      });
    };

    beforeEach(() => {
      scheduleFindOneBy.mockResolvedValue(mockSchedule());
    });

    it('creates a playlist and attaches a spotify-auto reference', async () => {
      mockSongs([
        {
          id: 10,
          title: 'Song A',
          references: [
            { url: 'https://open.spotify.com/track/abc?si=x' },
            { url: 'https://youtube.com/watch?v=y' },
          ],
        },
        {
          id: 11,
          title: 'Song B',
          references: [{ url: 'https://youtube.com/watch?v=z' }],
        },
      ]);

      fetchMock
        .mockImplementationOnce(async () =>
          jsonResponse({
            id: 'pl1',
            external_urls: {
              spotify: 'https://open.spotify.com/playlist/pl1',
            },
          }),
        )
        .mockImplementationOnce(async () =>
          jsonResponse({ snapshot_id: 'snap' }),
        );

      const result = await service.syncSchedulePlaylist(1, 1, {});

      expect(result.action).toBe('created');
      expect(result.url).toBe('https://open.spotify.com/playlist/pl1');
      expect(result.added).toBe(1);
      expect(result.skipped).toEqual([{ songId: 11, title: 'Song B' }]);

      // Creates an unlisted playlist with the derived name
      const [createCallUrl, createCallInit] = fetchCalls()[0];
      expect(createCallUrl).toBe(
        'https://api.spotify.com/v1/users/sp-user-1/playlists',
      );
      const createBody = JSON.parse(createCallInit!.body as string);
      expect(createBody.name).toBe('Sunday Service — 2026-11-15');
      expect(createBody.public).toBe(false);

      // Adds the track to the playlist
      const [tracksCallUrl, tracksCallInit] = fetchCalls()[1];
      expect(tracksCallUrl).toBe(
        'https://api.spotify.com/v1/playlists/pl1/tracks',
      );
      expect(JSON.parse(tracksCallInit!.body as string)).toEqual({
        uris: ['spotify:track:abc'],
      });

      // Stores the reference with sync metadata
      expect(scheduleUpdate).toHaveBeenCalledWith(1, {
        references: [
          expect.objectContaining({
            url: 'https://open.spotify.com/playlist/pl1',
            name: 'Sunday Service — 2026-11-15',
            source: 'spotify-auto',
            syncedBy: 42,
            syncedByName: 'Matias',
            tracksHash: computeTracksHash(['abc']),
          }),
        ],
      });
    });

    it('re-syncs an existing playlist in place without changing its name', async () => {
      const existing = {
        url: 'https://open.spotify.com/playlist/pl1',
        name: 'Custom playlist name',
        source: 'spotify-auto',
        syncedBy: 42,
        syncedByName: 'Matias',
        syncedAt: '2026-11-01T00:00:00Z',
        tracksHash: 'oldhash',
      };
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule({ references: [existing as any] }),
      );

      mockSongs([
        {
          id: 10,
          title: 'Song A',
          references: [{ url: 'https://open.spotify.com/track/def' }],
        },
        { id: 11, title: 'Song B', references: [] },
      ]);

      fetchMock.mockImplementationOnce(async () =>
        jsonResponse({ snapshot_id: 'snap2' }),
      );

      const result = await service.syncSchedulePlaylist(1, 1, {
        name: 'Ignored name',
      });

      expect(result.action).toBe('synced');
      expect(result.url).toBe('https://open.spotify.com/playlist/pl1');

      const [, tracksCallInit] = fetchCalls()[0];
      expect(JSON.parse(tracksCallInit!.body as string)).toEqual({
        uris: ['spotify:track:def'],
      });

      expect(scheduleUpdate).toHaveBeenCalledWith(1, {
        references: [
          expect.objectContaining({
            name: 'Custom playlist name',
            tracksHash: computeTracksHash(['def']),
          }),
        ],
      });
    });

    it('forbids re-syncing by a user other than the creator', async () => {
      const existing = {
        url: 'https://open.spotify.com/playlist/pl1',
        source: 'spotify-auto',
        syncedBy: 7,
      };
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule({ references: [existing as any] }),
      );

      await expect(service.syncSchedulePlaylist(1, 1, {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects a schedule without any Spotify references', async () => {
      mockSongs([
        { id: 10, title: 'Song A', references: [] },
        { id: 11, title: 'Song B', references: [] },
      ]);

      await expect(service.syncSchedulePlaylist(1, 1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when the schedule does not exist', async () => {
      scheduleFindOneBy.mockResolvedValue(null);

      await expect(service.syncSchedulePlaylist(1, 1, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('chunks more than 100 tracks across requests', async () => {
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule({
          items: Array.from({ length: 150 }, (_, i) => ({
            type: 'song',
            id: i + 1,
          })),
        }),
      );

      const songs = Array.from({ length: 150 }, (_, i) => ({
        id: i + 1,
        title: `Song ${i + 1}`,
        references: [{ url: `https://open.spotify.com/track/t${i + 1}` }],
      }));
      mockSongs(songs);

      // Create playlist + one PUT (100 tracks) + one POST (50 tracks)
      fetchMock
        .mockImplementationOnce(async () =>
          jsonResponse({
            id: 'pl1',
            external_urls: { spotify: 'https://open.spotify.com/playlist/pl1' },
          }),
        )
        .mockImplementationOnce(async () => jsonResponse({ snapshot_id: 's1' }))
        .mockImplementationOnce(async () =>
          jsonResponse({ snapshot_id: 's2' }),
        );

      const result = await service.syncSchedulePlaylist(1, 1, {});
      expect(result.added).toBe(150);

      const calls = fetchCalls();
      expect(calls).toHaveLength(3);
      expect(JSON.parse(calls[1][1]!.body as string).uris).toHaveLength(100);
      expect(JSON.parse(calls[2][1]!.body as string).uris).toHaveLength(50);
    });

    it('maps a missing Spotify playlist to a clear error', async () => {
      const existing = {
        url: 'https://open.spotify.com/playlist/pl1',
        source: 'spotify-auto',
        syncedBy: 42,
      };
      scheduleFindOneBy.mockResolvedValue(
        mockSchedule({ references: [existing as any] }),
      );
      mockSongs([
        {
          id: 10,
          title: 'Song A',
          references: [{ url: 'https://open.spotify.com/track/abc' }],
        },
        { id: 11, title: 'Song B', references: [] },
      ]);

      fetchMock.mockImplementationOnce(
        async () => new Response('Not Found', { status: 404 }),
      );

      await expect(service.syncSchedulePlaylist(1, 1, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('token refresh', () => {
    it('refreshes an expired access token before calling the API and rotates the refresh token', async () => {
      storedConnection = expiredConnection();

      const existing = {
        url: 'https://open.spotify.com/playlist/pl1',
        source: 'spotify-auto',
        syncedBy: 42,
      };
      scheduleFindOneBy.mockResolvedValue({
        id: 1,
        orgId: 1,
        title: 'T',
        date: null,
        items: [{ type: 'song', id: 10 }],
        references: [existing as any],
      } as Schedule);
      songsQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 10,
            title: 'Song A',
            references: [{ url: 'https://open.spotify.com/track/abc' }],
          },
        ]),
      });

      fetchMock
        .mockImplementationOnce(async () =>
          jsonResponse({
            access_token: 'refreshed-access',
            refresh_token: 'rotated-refresh',
            expires_in: 3600,
          }),
        )
        .mockImplementationOnce(async () =>
          jsonResponse({ snapshot_id: 's1' }),
        );

      await service.syncSchedulePlaylist(1, 1, {});

      expect(usersUpdate).toHaveBeenCalledWith(42, {
        spotify: expect.objectContaining({
          accessToken: 'refreshed-access',
          refreshToken: 'rotated-refresh',
        }),
      });

      // The playlist write must have used the refreshed token
      const [, tracksCallInit] = fetchCalls()[1];
      expect((tracksCallInit!.headers as any).Authorization).toBe(
        'Bearer refreshed-access',
      );
    });

    it('forces a refresh and retries once when the API rejects the token', async () => {
      const existing = {
        url: 'https://open.spotify.com/playlist/pl1',
        source: 'spotify-auto',
        syncedBy: 42,
      };
      scheduleFindOneBy.mockResolvedValue({
        id: 1,
        orgId: 1,
        title: 'T',
        date: null,
        items: [{ type: 'song', id: 10 }],
        references: [existing as any],
      } as Schedule);
      songsQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 10,
            title: 'Song A',
            references: [{ url: 'https://open.spotify.com/track/abc' }],
          },
        ]),
      });

      fetchMock
        .mockImplementationOnce(
          async () => new Response('Expired', { status: 401 }),
        )
        .mockImplementationOnce(async () =>
          jsonResponse({
            access_token: 'forced-refresh-access',
            expires_in: 3600,
          }),
        )
        .mockImplementationOnce(async () =>
          jsonResponse({ snapshot_id: 's1' }),
        );

      const result = await service.syncSchedulePlaylist(1, 1, {});
      expect(result.action).toBe('synced');

      const calls = fetchCalls();
      expect(calls).toHaveLength(3);
      expect((calls[0][1]!.headers as any).Authorization).toBe(
        'Bearer access-token',
      );
      expect((calls[2][1]!.headers as any).Authorization).toBe(
        'Bearer forced-refresh-access',
      );
    });
  });
});
