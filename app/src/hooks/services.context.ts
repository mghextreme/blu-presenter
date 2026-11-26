import { createContext } from 'react';
import type {
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
