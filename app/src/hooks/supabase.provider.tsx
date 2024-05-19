import { createContext, useContext, useMemo } from "react";
import { supabase as config } from "@/lib/config";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type SupabaseProviderProps = {
  children: React.ReactNode
}

type SupabaseProviderState = {
  supabase?: SupabaseClient,
}

const initialState: SupabaseProviderState = {
  supabase: undefined,
}

const SupabaseContext = createContext<SupabaseProviderState>(initialState);

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {

  const supabase = useMemo(() => createClient(config.url, config.key), [config]);

  return <SupabaseContext.Provider value={{supabase}}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = () => {
  return useContext(SupabaseContext);
};
