import { createContext, useMemo } from "react";
import { AuthService, OrganizationsService, SessionsService, SongsService, ThemesService, UsersService } from "@/services";
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
}

const initialState: ServicesProviderState = {
  authService: {} as AuthService,
  songsService: {} as SongsService,
  usersService: {} as UsersService,
  organizationsService: {} as OrganizationsService,
  themesService: {} as ThemesService,
  sessionsService: {} as SessionsService,
}

export const ServicesContext = createContext<ServicesProviderState>(initialState);

export const ServicesProvider = ({ queryClient, children }: ServicesProviderProps) => {

  const songsService = useMemo(() => new SongsService(queryClient, config.api), [queryClient, config]);
  const usersService = useMemo(() => new UsersService(queryClient, config.api), [queryClient, config]);
  const organizationsService = useMemo(() => new OrganizationsService(queryClient, config.api), [queryClient, config]);
  const authService = useMemo(() => new AuthService(queryClient, config.api, organizationsService), [queryClient, config, organizationsService]);
  const themesService = useMemo(() => new ThemesService(queryClient, config.api), [queryClient, config]);
  const sessionsService = useMemo(() => new SessionsService(queryClient, config.api), [queryClient, config]);

  const value = {
    authService,
    songsService,
    usersService,
    organizationsService,
    themesService,
    sessionsService,
  };
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
};
