import { createContext, useContext, useMemo } from "react";
import { SongsService, UsersService } from "@/services";
import * as config from "@/lib/config";

type ServicesProviderProps = {
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

export const ServicesProvider = ({ children }: ServicesProviderProps) => {

  const songsService = useMemo(() => new SongsService(config.api), [config]);
  const usersService = useMemo(() => new UsersService(config.api), [config]);

  const value = {
    songsService,
    usersService,
  };
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
};

export const useServices = () => {
  return useContext(ServicesContext);
};
