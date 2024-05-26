import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Session, SignInWithPasswordCredentials, SignUpWithPasswordCredentials, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  isLoggedIn: boolean
  user: User | null
  session: Session | null
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<void>
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      session: null,
      signIn: async (credentials: SignInWithPasswordCredentials) => {
        const { data, error } = await supabase.auth.signInWithPassword(credentials);

        if (error) throw error;

        set({
          isLoggedIn: true,
          user: data.user,
          session: data.session,
        });
      },
      signUp: async (credentials: SignUpWithPasswordCredentials) => {
        const { data, error } = await supabase.auth.signUp(credentials);

        if (error) throw error;

        set({
          isLoggedIn: true,
          user: data.user,
          session: data.session,
        });
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        set({
          isLoggedIn: false,
          user: null,
          session: null,
        });
      },
    }),
    {
      name: "auth",
      getStorage: () => localStorage,
      partialize: (state: AuthState) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        session: state.session,
      }),
    }
  )
);
