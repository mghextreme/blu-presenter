import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OrganizationState {
  organizationId: number | null
  setOrganizationId: (orgId: number) => void
}

export const useOrganization = create<OrganizationState>()(
  persist(
    (set) => ({
      organizationId: null,
      setOrganizationId: (orgId: number) => {
        return set(() => ({ organizationId: orgId }))
      },
    }),
    {
      name: "organization",
      getStorage: () => localStorage,
      partialize: (state: OrganizationState) => ({
        organizationId: state.organizationId,
      }),
    }
  )
);
