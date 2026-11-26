import { createContext, useMemo } from 'react';
import {
  AuthService,
  BroadcastService,
  OfflineDownloadsService,
  OrganizationsService,
  SchedulesService,
  SessionsService,
  SongsService,
  SpotifyService,
  ThemesService,
  UsersService,
  YoutubeService,
} from '@/services';
import * as config from '@/lib/config';
import { QueryClient } from '@tanstack/react-query';

type ServicesProviderProps = {
  queryClient: QueryClient;
  children: React.ReactNode;
};

export type ServicesProviderState = {
  authService: AuthService;
  songsService: SongsService;
  usersService: UsersService;
  organizationsService: OrganizationsService;
  themesService: ThemesService;
  sessionsService: SessionsService;
  schedulesService: SchedulesService;
  broadcastService: BroadcastService;
  offlineDownloadsService: OfflineDownloadsService;
  spotifyService: SpotifyService;
  youtubeService: YoutubeService;
};

const initialState: ServicesProviderState = {
  authService: {} as AuthService,
  songsService: {} as SongsService,
  usersService: {} as UsersService,
  organizationsService: {} as OrganizationsService,
  themesService: {} as ThemesService,
  sessionsService: {} as SessionsService,
  schedulesService: {} as SchedulesService,
  broadcastService: {} as BroadcastService,
  offlineDownloadsService: {} as OfflineDownloadsService,
  spotifyService: {} as SpotifyService,
  youtubeService: {} as YoutubeService,
};

export const ServicesContext = createContext<ServicesProviderState>(initialState);

export const ServicesProvider = ({ queryClient, children }: Readonly<ServicesProviderProps>) => {
  const songsService = useMemo(() => new SongsService(queryClient, config.api), [queryClient]);
  const usersService = useMemo(() => new UsersService(queryClient, config.api), [queryClient]);
  const organizationsService = useMemo(
    () => new OrganizationsService(queryClient, config.api),
    [queryClient],
  );
  const authService = useMemo(
    () => new AuthService(queryClient, config.api, organizationsService),
    [queryClient, organizationsService],
  );
  const themesService = useMemo(() => new ThemesService(queryClient, config.api), [queryClient]);
  const sessionsService = useMemo(
    () => new SessionsService(queryClient, config.api),
    [queryClient],
  );
  const schedulesService = useMemo(
    () => new SchedulesService(queryClient, config.api),
    [queryClient],
  );
  const broadcastService = useMemo(
    () => new BroadcastService(queryClient, config.api),
    [queryClient],
  );
  const spotifyService = useMemo(() => new SpotifyService(queryClient, config.api), [queryClient]);
  const youtubeService = useMemo(() => new YoutubeService(queryClient, config.api), [queryClient]);
  const offlineDownloadsService = useMemo(
    () => new OfflineDownloadsService(songsService, schedulesService, themesService),
    [songsService, schedulesService, themesService],
  );

  // Memoized so consumers don't re-render each time the provider does.
  const value = useMemo<ServicesProviderState>(
    () => ({
      authService,
      songsService,
      usersService,
      organizationsService,
      themesService,
      sessionsService,
      schedulesService,
      broadcastService,
      offlineDownloadsService,
      spotifyService,
      youtubeService,
    }),
    [
      authService,
      songsService,
      usersService,
      organizationsService,
      themesService,
      sessionsService,
      schedulesService,
      broadcastService,
      offlineDownloadsService,
      spotifyService,
      youtubeService,
    ],
  );
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
};
