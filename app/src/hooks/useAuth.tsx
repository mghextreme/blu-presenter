import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Session, SignInWithPasswordCredentials, SignUpWithPasswordCredentials, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { IOrganization } from '@/types'

interface AuthState {
  isLoggedIn: boolean
  user: User | null
  session: Session | null
  organization: IOrganization | null
  organizations: IOrganization[]
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<void>
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  setOrganizationById: (orgId: number | null) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      organization: null,
      organizations: [],
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
          organizations: [],
        });
      },
      refreshSession: async () => {
        const session = get().session;
        if (!session) throw Error("No session to refresh.");

        console.debug('Refreshing user session');
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: session.refresh_token });

        if (error) {
          set({
            isLoggedIn: false,
            user: undefined,
            session: undefined,
          });
          throw error;
        }

        set({
          isLoggedIn: true,
          user: data.user,
          session: data.session,
        });
      },
      setOrganizationById: (orgId: number | null) => {
        if (orgId === null) {
          const currentOrg = get().organization;
          const currentOrgInMap = get().organizations.find((org) => org.id === currentOrg?.id);

          if (!currentOrgInMap) {
            set({
              organization: get().organizations[0] || null,
            });
          }
          return;
        }

        const org = get().organizations.find((org) => org.id === orgId);
        if (!org) throw new Error(`Organization with id ${orgId} not found`);

        set({
          organization: org,
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
        organization: state.organization,
        organizations: state.organizations,
      }),
    }
  )
);
