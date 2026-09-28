import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { IOrganization } from '@/types'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import type { OptionalOrganization } from '@/components/app/organization-bar'

export type OrganizationFilter = {
  organizations?: number[];
  searchPublicArchive?: boolean;
}

interface OrganizationFilterState extends OrganizationFilter {
  setFilter: (filter: OrganizationFilter) => void
  reset: () => void
}

// Shared, persisted organization filter for the content list pages
// (songs, themes, schedules, sessions). Kept in a single selection so that
// the chosen organizations follow the user across pages.
export const useOrganizationFilter = create<OrganizationFilterState>()(
  persist(
    (set) => ({
      organizations: undefined,
      searchPublicArchive: undefined,
      setFilter: (filter) => set({
        organizations: filter.organizations?.length ? filter.organizations : undefined,
        searchPublicArchive: filter.searchPublicArchive,
      }),
      reset: () => set({ organizations: undefined, searchPublicArchive: undefined }),
    }),
    {
      name: STORAGE_KEYS.organizationFilter,
      partialize: (state: OrganizationFilterState) => ({
        organizations: state.organizations,
        searchPublicArchive: state.searchPublicArchive,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/** Returns the stored filter with organization ids the user no longer belongs to removed (resetting the filter when that happens). */
export function resolveFilter(userOrganizations: IOrganization[]): OrganizationFilter {
  const { organizations, searchPublicArchive } = useOrganizationFilter.getState();
  const resolved = (organizations ?? [])
    .filter((id) => userOrganizations.some((org) => org.id === id));

  if (resolved.length !== (organizations?.length ?? 0)) {
    useOrganizationFilter.getState().reset();
    return {};
  }

  return { organizations: resolved.length ? resolved : undefined, searchPublicArchive };
}

/** Maps the stored organization ids back to organizations, resolving them against the user's orgs (drops unknown ids). A `null` entry represents the public archive. */
export function filterToSelection(userOrganizations: IOrganization[]): OptionalOrganization[] {
  const { organizations, searchPublicArchive } = resolveFilter(userOrganizations);
  const selected = (organizations ?? [])
    .map((id) => userOrganizations.find((org) => org.id === id))
    .filter((org): org is IOrganization => !!org);
  return searchPublicArchive ? [...selected, null] : selected;
}

export function selectionToFilter(orgs: OptionalOrganization[]): OrganizationFilter {
  const orgIds = orgs
    .filter((org) => org !== null)
    .map((org) => org!.id);
  return {
    organizations: orgIds.length > 0 ? orgIds : undefined,
    searchPublicArchive: orgs.includes(null),
  };
}
