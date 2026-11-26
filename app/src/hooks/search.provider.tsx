import { SongSearchFilters, SongsService } from '@/services';
import { ISongWithRole, SupportedLanguage } from '@/types';
import i18next from 'i18next';
import { createContext, useContext, useMemo, useState } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import type { OrganizationFilter } from '@/hooks/use-organization-filter';

export type AdvancedSearchOptions = {
  languages?: SupportedLanguage[];
  organizations?: number[];
  searchPublicArchive?: boolean;
};

type SearchProviderProps = {
  songsService: SongsService;
  /** First page, already loaded by the route loader for the initial filters. */
  defaultValue?: ISongWithRole[];
  /** Organization filter active on mount (restored from the persisted filter). */
  initialOrganizationFilter?: OrganizationFilter;
  children?: React.ReactNode;
};

type SearchRequest =
  | {
      type: 'basic';
      query: string;
      includeBlocks: boolean;
    }
  | {
      type: 'advanced';
      query: string | undefined;
      options: AdvancedSearchOptions & { includeBlocks?: boolean };
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

const SearchContext = createContext<SearchProviderState>({
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

function readStoredFormValues(): AdvancedSearchOptions {
  try {
    const storedFormValues = localStorage.getItem(STORAGE_KEYS.advancedSearchOptions);
    return storedFormValues ? (JSON.parse(storedFormValues) ?? {}) : {};
  } catch {
    return {};
  }
}

function toSearchFilters(
  request: SearchRequest | null,
  organizationFilter: OrganizationFilter,
): SongSearchFilters {
  const filters: SongSearchFilters = {
    queryLanguage: (i18next.resolvedLanguage || 'en') as SupportedLanguage,
    organizations: organizationFilter.organizations,
    searchPublicArchive: organizationFilter.searchPublicArchive,
  };

  if (request?.type === 'basic') {
    return { ...filters, query: request.query, includeBlocks: request.includeBlocks };
  }

  if (request?.type === 'advanced') {
    return {
      ...filters,
      query: request.query && request.query.length >= 2 ? request.query : undefined,
      languages: request.options.languages,
      includeBlocks: request.options.includeBlocks,
    };
  }

  return filters;
}

export const SearchProvider = ({
  songsService,
  defaultValue,
  initialOrganizationFilter,
  children,
}: Readonly<SearchProviderProps>) => {
  const [request, setRequest] = useState<SearchRequest | null>(null);
  const [organizationFilter, setOrganizationFilterState] = useState<OrganizationFilter>(
    initialOrganizationFilter ?? {},
  );
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [filtersResetAt, setFiltersResetAt] = useState<number>(0);
  const [formValues, setFormValues] = useState<AdvancedSearchOptions>(readStoredFormValues);

  const searchResults = useInfiniteQuery({
    ...songsService.searchPagesQuery(toSearchFilters(request, organizationFilter)),
    initialData:
      !hasSearched && defaultValue ? { pages: [defaultValue], pageParams: [1] } : undefined,
    enabled: hasSearched || defaultValue !== undefined,
    placeholderData: keepPreviousData,
  });

  const results = useMemo(() => searchResults.data?.pages.flat() ?? [], [searchResults.data]);
  const { fetchNextPage, isFetching, hasNextPage } = searchResults;

  const value = useMemo<SearchProviderState>(() => {
    const setAndStoreFormValues = (values: AdvancedSearchOptions) => {
      setFormValues(values);
      localStorage.setItem(STORAGE_KEYS.advancedSearchOptions, JSON.stringify(values));
    };

    /** Shows the results for the new criteria; resolves once they are loaded and rejects if the search fails. */
    const runSearch = async (
      nextRequest: SearchRequest | null,
      nextOrganizationFilter: OrganizationFilter,
    ) => {
      setRequest(nextRequest);
      setOrganizationFilterState(nextOrganizationFilter);
      setHasSearched(true);
      await songsService.searchPages(toSearchFilters(nextRequest, nextOrganizationFilter));
    };

    return {
      formValues,
      search: async (query: string, includeBlocks: boolean = false) => {
        await runSearch({ type: 'basic', query, includeBlocks }, organizationFilter);
      },
      advancedSearch: async (query, options) => {
        setAndStoreFormValues({ languages: options.languages });
        await runSearch({ type: 'advanced', query, options }, organizationFilter);
      },
      setOrganizationFilter: async (filter) => {
        await runSearch(request, filter);
      },
      resetFilters: async () => {
        setAndStoreFormValues({});
        setFiltersResetAt((count) => count + 1);
        await runSearch(null, {});
      },
      loadMore: async () => {
        await fetchNextPage({ throwOnError: true });
      },
      isSearching: isFetching,
      hasMore: hasNextPage,
      filtersResetAt,
      results,
    };
  }, [
    songsService,
    request,
    organizationFilter,
    formValues,
    filtersResetAt,
    results,
    isFetching,
    hasNextPage,
    fetchNextPage,
  ]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
  return useContext(SearchContext);
};
