import { SongsService } from "@/services";
import { ISongWithRole, SupportedLanguage } from "@/types";
import i18next from "i18next";
import { createContext, useContext, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export type AdvancedSearchOptions = {
  languages?: SupportedLanguage[];
  organizations?: number[];
  searchPublicArchive?: boolean;
}

type SearchProviderProps = {
  songsService: SongsService;
  defaultValue?: ISongWithRole[];
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
  refresh: () => Promise<void>;
  isSearching: boolean;
  results: ISongWithRole[];
}

const initialState: SearchProviderState = {
  formValues: {} as AdvancedSearchOptions,
  search: () => Promise.resolve(),
  advancedSearch: () => Promise.resolve(),
  refresh: () => Promise.resolve(),
  isSearching: false,
  results: [],
}

const SearchContext = createContext<SearchProviderState>(initialState);

export const SearchProvider = ({ songsService, defaultValue, children }: SearchProviderProps) => {
  const [results, setResults] = useState<ISongWithRole[]>(defaultValue ?? []);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [lastSearchRequest, setLastSearchRequest] = useState<SearchRequest | null>(null);

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

  const setAndStoreFormValues = (values: AdvancedSearchOptions) => {
    setFormValues(values);
    localStorage.setItem(STORAGE_KEYS.advancedSearchOptions, JSON.stringify(values));
  };

  const executeSearch = async (request: SearchRequest | null) => {
    setIsSearching(true);
    const curLang = (i18next.resolvedLanguage || 'en') as SupportedLanguage;

    try {
      if (request?.type === 'basic') {
        const response = await songsService.search({
          query: request.query,
          queryLanguage: curLang ?? undefined,
          includeBlocks: request.includeBlocks,
        });
        setResults(response);
        return;
      }

      if (request?.type === 'advanced') {
        const response = await songsService.search({
          query: request.query && request.query.length >= 2 ? request.query : undefined,
          queryLanguage: curLang ?? undefined,
          languages: request.options.languages,
          organizations: request.options.organizations,
          searchPublicArchive: request.options.searchPublicArchive,
          includeBlocks: request.options.includeBlocks,
        });
        setResults(response);
        return;
      }

      const response = await songsService.search({
        queryLanguage: curLang ?? undefined,
      });
      setResults(response);
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
    await executeSearch(request);
  };

  const advancedSearch = async (query: string | undefined, options: AdvancedSearchOptions & { includeBlocks?: boolean; }) => {
    const request: SearchRequest = {
      type: 'advanced',
      query,
      options,
    };

    setLastSearchRequest(request);
    setAndStoreFormValues(options as AdvancedSearchOptions);

    await executeSearch(request);
  };

  const refresh = async () => {
    await executeSearch(lastSearchRequest);
  };

  const value = useMemo(() => {
    return {
      formValues,
      search,
      isSearching,
      advancedSearch,
      refresh,
      results,
    };
  }, [formValues, isSearching, results, lastSearchRequest]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
  return useContext(SearchContext);
};
