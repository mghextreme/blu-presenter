import { SongsService } from "@/services";
import { ISongWithRole, SupportedLanguage } from "@/types";
import i18next from "i18next";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { PAGE_SIZE } from "@/lib/pagination";

export type AdvancedSearchOptions = {
  languages?: SupportedLanguage[];
  organizations?: number[];
  searchPublicArchive?: boolean;
}

export type OrganizationFilter = {
  organizations?: number[];
  searchPublicArchive?: boolean;
}

type SearchProviderProps = {
  songsService: SongsService;
  defaultValue?: ISongWithRole[];
  /** Organization filter active on mount (restored from the persisted filter). */
  initialOrganizationFilter?: OrganizationFilter;
  children?: React.ReactNode;
}

type SearchRequest =
  | {
    type: 'basic';
    query: string;
    includeBlocks: boolean;
  }
  | {
    type: 'advanced';
    query: string | undefined;
    options: AdvancedSearchOptions & { includeBlocks?: boolean; };
  };

export type SearchProviderState = {
  formValues: AdvancedSearchOptions;
  search: (query: string, includeBlocks: boolean) => Promise<void>;
  advancedSearch: (query: string | undefined, options: AdvancedSearchOptions & { includeBlocks?: boolean; }) => Promise<void>;
  setOrganizationFilter: (filter: OrganizationFilter) => Promise<void>;
  resetFilters: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  isSearching: boolean;
  hasMore: boolean;
  /** Incremented every time the persisted filters are reset, so forms can clear their fields. */
  filtersResetAt: number;
  results: ISongWithRole[];
}

const initialState: SearchProviderState = {
  formValues: {} as AdvancedSearchOptions,
  search: () => Promise.resolve(),
  advancedSearch: () => Promise.resolve(),
  setOrganizationFilter: () => Promise.resolve(),
  resetFilters: () => Promise.resolve(),
  loadMore: () => Promise.resolve(),
  refresh: () => Promise.resolve(),
  isSearching: false,
  hasMore: false,
  filtersResetAt: 0,
  results: [],
}

const SearchContext = createContext<SearchProviderState>(initialState);

export const SearchProvider = ({ songsService, defaultValue, initialOrganizationFilter, children }: SearchProviderProps) => {
  const [results, setResults] = useState<ISongWithRole[]>(defaultValue ?? []);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>((defaultValue?.length ?? 0) === PAGE_SIZE);
  const [lastSearchRequest, setLastSearchRequest] = useState<SearchRequest | null>(null);
  const [page, setPage] = useState<number>(1);
  const [filtersResetAt, setFiltersResetAt] = useState<number>(0);

  try {
    const storedFormValues = localStorage.getItem(STORAGE_KEYS.advancedSearchOptions);
    if (storedFormValues) {
      initialState.formValues = (JSON.parse(storedFormValues) as AdvancedSearchOptions) || null;
    }
  }
  catch (e) {
    // Ignore error
  }
  const [formValues, setFormValues] = useState<AdvancedSearchOptions>(initialState.formValues);

  // Kept in a ref so that searches triggered in the same tick as a filter
  // change always see the latest value.
  const organizationFilterRef = useRef<OrganizationFilter>(initialOrganizationFilter ?? {});

  const setAndStoreFormValues = (values: AdvancedSearchOptions) => {
    setFormValues(values);
    localStorage.setItem(STORAGE_KEYS.advancedSearchOptions, JSON.stringify(values));
  };

  const buildPayload = (request: SearchRequest | null, page: number) => {
    const curLang = (i18next.resolvedLanguage || 'en') as SupportedLanguage;
    const organizationFilter = organizationFilterRef.current;

    if (request?.type === 'basic') {
      return {
        query: request.query,
        queryLanguage: curLang ?? undefined,
        includeBlocks: request.includeBlocks,
        ...organizationFilter,
        page,
        itemsPerPage: PAGE_SIZE,
      };
    }

    if (request?.type === 'advanced') {
      return {
        query: request.query && request.query.length >= 2 ? request.query : undefined,
        queryLanguage: curLang ?? undefined,
        languages: request.options.languages,
        includeBlocks: request.options.includeBlocks,
        ...organizationFilter,
        page,
        itemsPerPage: PAGE_SIZE,
      };
    }

    return {
      queryLanguage: curLang ?? undefined,
      ...organizationFilter,
      page,
      itemsPerPage: PAGE_SIZE,
    };
  };

  const runSearch = async (request: SearchRequest | null, page: number, append: boolean) => {
    setIsSearching(true);

    try {
      const response = await songsService.search(buildPayload(request, page));
      setResults((prev) => append ? [...prev, ...response] : response);
      setHasMore(response.length === PAGE_SIZE);
    } finally {
      setIsSearching(false);
    }
  };

  const search = async (query: string, includeBlocks: boolean = false) => {
    const request: SearchRequest = {
      type: 'basic',
      query,
      includeBlocks,
    };

    setLastSearchRequest(request);
    setPage(1);
    await runSearch(request, 1, false);
  };

  const advancedSearch = async (query: string | undefined, options: AdvancedSearchOptions & { includeBlocks?: boolean; }) => {
    const request: SearchRequest = {
      type: 'advanced',
      query,
      options,
    };

    setLastSearchRequest(request);
    setPage(1);
    setAndStoreFormValues({
      languages: options.languages,
    } as AdvancedSearchOptions);
    await runSearch(request, 1, false);
  };

  const setOrganizationFilter = async (filter: OrganizationFilter) => {
    organizationFilterRef.current = filter;
    setPage(1);
    await runSearch(lastSearchRequest, 1, false);
  };

  const resetFilters = async () => {
    organizationFilterRef.current = {};
    setAndStoreFormValues({});
    setLastSearchRequest(null);
    setFiltersResetAt((value) => value + 1);
    setPage(1);
    await runSearch(null, 1, false);
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await runSearch(lastSearchRequest, nextPage, true);
  };

  const refresh = async () => {
    setPage(1);
    await runSearch(lastSearchRequest, 1, false);
  };

  const value = useMemo(() => {
    return {
      formValues,
      search,
      isSearching,
      advancedSearch,
      setOrganizationFilter,
      resetFilters,
      loadMore,
      refresh,
      hasMore,
      filtersResetAt,
      results,
    };
  }, [formValues, isSearching, hasMore, results, lastSearchRequest, page, filtersResetAt]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
  return useContext(SearchContext);
};
