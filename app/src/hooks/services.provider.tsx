import { createContext, useContext, useMemo } from "react";
import { OrganizationsService, SongsService, UsersService } from "@/services";
import * as config from "@/lib/config";
import { QueryClient } from "@tanstack/react-query";

type ServicesProviderProps = {
  queryClient: QueryClient
  children: React.ReactNode
}

export type ServicesProviderState = {
  songsService: SongsService,
  usersService: UsersService,
  organizationsService: OrganizationsService,
}

const initialState: ServicesProviderState = {
  songsService: {},
  usersService: {},
  organizationsService: {},
}

const ServicesContext = createContext<ServicesProviderState>(initialState);

export const ServicesProvider = ({ queryClient, children }: ServicesProviderProps) => {

  const songsService = useMemo(() => new SongsService(queryClient, config.api), [queryClient, config]);
  const usersService = useMemo(() => new UsersService(queryClient, config.api), [queryClient, config]);
  const organizationsService = useMemo(() => new OrganizationsService(queryClient, config.api), [queryClient, config]);

  const value = {
    songsService,
    usersService,
    organizationsService,
  };
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
};

export const useServices = () => {
  return useContext(ServicesContext);
};
