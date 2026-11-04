import { createContext, useMemo } from "react";
import { AuthService, BroadcastService, OfflineDownloadsService, OrganizationsService, SchedulesService, SessionsService, SongsService, ThemesService, UsersService } from "@/services";
import * as config from "@/lib/config";
import { QueryClient } from "@tanstack/react-query";

type ServicesProviderProps = {
  queryClient: QueryClient
  children: React.ReactNode
}

export type ServicesProviderState = {
  authService: AuthService,
  songsService: SongsService,
  usersService: UsersService,
  organizationsService: OrganizationsService,
  themesService: ThemesService,
  sessionsService: SessionsService,
  schedulesService: SchedulesService,
  broadcastService: BroadcastService,
  offlineDownloadsService: OfflineDownloadsService,
}

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
}

export const ServicesContext = createContext<ServicesProviderState>(initialState);

export const ServicesProvider = ({ queryClient, children }: Readonly<ServicesProviderProps>) => {

  const songsService = useMemo(() => new SongsService(queryClient, config.api), [queryClient, config]);
  const usersService = useMemo(() => new UsersService(queryClient, config.api), [queryClient, config]);
  const organizationsService = useMemo(() => new OrganizationsService(queryClient, config.api), [queryClient, config]);
  const authService = useMemo(() => new AuthService(queryClient, config.api, organizationsService), [queryClient, config, organizationsService]);
  const themesService = useMemo(() => new ThemesService(queryClient, config.api), [queryClient, config]);
  const sessionsService = useMemo(() => new SessionsService(queryClient, config.api), [queryClient, config]);
  const schedulesService = useMemo(() => new SchedulesService(queryClient, config.api), [queryClient, config]);
  const broadcastService = useMemo(() => new BroadcastService(queryClient, config.api), [queryClient, config]);
  const offlineDownloadsService = useMemo(
    () => new OfflineDownloadsService(queryClient, songsService, schedulesService, themesService),
    [queryClient, songsService, schedulesService, themesService],
  );

  const value = {
    authService,
    songsService,
    usersService,
    organizationsService,
    themesService,
    sessionsService,
    schedulesService,
    broadcastService,
    offlineDownloadsService,
  };
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
};
