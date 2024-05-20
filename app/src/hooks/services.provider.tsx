import { createContext, useContext, useMemo } from "react";
import { SongsService } from "@/services";
import * as config from "@/lib/config";

type ServicesProviderProps = {
  children: React.ReactNode
}

export type ServicesProviderState = {
  songsService: SongsService,
}

const initialState: ServicesProviderState = {
  songsService: {},
}

const ServicesContext = createContext<ServicesProviderState>(initialState);

export const ServicesProvider = ({ children }: ServicesProviderProps) => {

  const songsService = useMemo(() => new SongsService(config.api), [config]);

  const value = {
    songsService,
  };
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
};

export const useServices = () => {
  return useContext(ServicesContext);
};
