import { createContext, useContext, useMemo } from "react";
import { SongsService, UsersService } from "@/services";
import * as config from "@/lib/config";
import { QueryClient } from "@tanstack/react-query";

type ServicesProviderProps = {
  queryClient: QueryClient
  children: React.ReactNode
}

export type ServicesProviderState = {
  songsService: SongsService,
  usersService: UsersService,
}

const initialState: ServicesProviderState = {
  songsService: {},
  usersService: {},
}

const ServicesContext = createContext<ServicesProviderState>(initialState);

export const ServicesProvider = ({ queryClient, children }: ServicesProviderProps) => {

  const songsService = useMemo(() => new SongsService(queryClient, config.api), [queryClient, config]);
  const usersService = useMemo(() => new UsersService(queryClient, config.api), [queryClient, config]);

  const value = {
    songsService,
    usersService,
  };
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
};

export const useServices = () => {
  return useContext(ServicesContext);
};
