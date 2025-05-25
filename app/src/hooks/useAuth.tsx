import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Session, User } from '@supabase/supabase-js'
import { IOrganization } from '@/types'

interface AuthState {
  isLoggedIn: boolean
  user: User | null
  orgId?: number
  session: Session | null
  organization: IOrganization | null
  organizations: IOrganization[]
  setOrganizationById: (orgId?: number) => void
  signOut: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      orgId: undefined,
      organization: null,
      organizations: [],
      session: null,
      setOrganizationById: (orgId?: number) => {
        if (!orgId) {
          const allOrgs = get().organizations;
          const currentOrg = get().orgId;
          const currentOrgInMap = allOrgs.find((org) => org.id === currentOrg);

          let data: Partial<AuthState> | undefined = undefined;
          if (currentOrgInMap) {
            data = {
              organization: currentOrgInMap,
              orgId: orgId,
            }
          } else if (allOrgs.length > 0) {
            data = {
              organization: allOrgs[0],
              orgId: allOrgs[0].id,
            }
          }

          if (data) {
            set(data);
          }
          return;
        }

        const org = get().organizations.find((org) => org.id === orgId);
        if (!org) throw new Error(`Organization with id ${orgId} not found`);

        set({
          organization: org,
          orgId: org.id,
        });
      },
      signOut: () => {
        set({
          isLoggedIn: false,
          user: null,
          organization: null,
          organizations: [],
          session: null,
        })
      }
    }),
    {
      name: "auth",
      partialize: (state: AuthState) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        session: state.session,
        orgId: state.orgId,
        organization: state.organization,
        organizations: state.organizations,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
