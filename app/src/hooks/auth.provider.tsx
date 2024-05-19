import { createContext, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Session, SignInWithPasswordCredentials, SignUpWithPasswordCredentials, User } from '@supabase/supabase-js'
import { useLocalStorage } from "./localstorage.hook";
import { useSupabase } from "./supabase.provider";

type AuthProviderProps = {
  children: React.ReactNode
}

type AuthProviderState = {
  isLoggedIn: boolean,
  user?: User,
  session?: Session,
  login: (credentials: SignUpWithPasswordCredentials) => Promise<void>,
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<void>,
  logout: () => Promise<void>,
}

const initialState: AuthProviderState = {
  isLoggedIn: false,
  user: undefined,
  session: undefined,
  login: async () => {},
  signUp: async () => {},
  logout: async () => {},
}

const AuthContext = createContext<AuthProviderState>(initialState);

export const AuthProvider = ({ children }: AuthProviderProps) => {

  const { supabase } = useSupabase();
  if (!supabase) {
    throw new Error("Supabase not initialized");
  }

  const [user, setUser] = useLocalStorage("user", initialState.user);
  const [session, setSession] = useLocalStorage("session", initialState.session);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(user && session ? true : initialState.isLoggedIn);
  const navigate = useNavigate();

  const login = async (credentials: SignInWithPasswordCredentials) => {
    const result = await supabase.auth.signInWithPassword(credentials);
    
    if (result.error) {
      throw new Error("Error signing up");
    }

    setIsLoggedIn(true);
    setSession(result.data.session);
    setUser(result.data.user);
    navigate("/app", { replace: true });
  };

  const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    const result = await supabase.auth.signUp(credentials);
    
    if (result.error) {
      throw new Error("Error signing up");
    }

    setIsLoggedIn(true);
    setSession(result.data.session);
    setUser(result.data.user);
  };

  const logout = async () => {
    setSession(undefined);
    setUser(undefined);
    setIsLoggedIn(false);
    navigate("/", { replace: true });
  };

  const value = useMemo(
    () => ({
      isLoggedIn,
      user,
      session,
      login,
      signUp,
      logout,
    }),
    [isLoggedIn, user, session],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
