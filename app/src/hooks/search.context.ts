import { createContext } from 'react';
import type { ISongWithRole, SupportedLanguage } from '@/types';
import type { OrganizationFilter } from '@/hooks/use-organization-filter';

export type AdvancedSearchOptions = {
  languages?: SupportedLanguage[];
  organizations?: number[];
  searchPublicArchive?: boolean;
};

export type SearchProviderState = {
  formValues: AdvancedSearchOptions;
  search: (query: string, includeBlocks: boolean) => Promise<void>;
  advancedSearch: (
    query: string | undefined,
    options: AdvancedSearchOptions & { includeBlocks?: boolean },
  ) => Promise<void>;
  setOrganizationFilter: (filter: OrganizationFilter) => Promise<void>;
  resetFilters: () => Promise<void>;
  loadMore: () => Promise<void>;
  isSearching: boolean;
  hasMore: boolean;
  /** Incremented every time the persisted filters are reset, so forms can clear their fields. */
  filtersResetAt: number;
  results: ISongWithRole[];
};

export const SearchContext = createContext<SearchProviderState>({
  formValues: {},
  search: () => Promise.resolve(),
  advancedSearch: () => Promise.resolve(),
  setOrganizationFilter: () => Promise.resolve(),
  resetFilters: () => Promise.resolve(),
  loadMore: () => Promise.resolve(),
  isSearching: false,
  hasMore: false,
  filtersResetAt: 0,
  results: [],
});
