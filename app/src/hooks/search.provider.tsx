import { SongsService } from "@/services";
import { ISongWithRole, SupportedLanguage } from "@/types";
import i18next from "i18next";
import { createContext, useContext, useMemo, useState } from "react";

export type AdvancedSearchOptions = {
  languages?: SupportedLanguage[];
  organizations?: number[];
  searchPublicArchive?: boolean;
}

type SearchProviderProps = {
  songsService: SongsService;
  children?: React.ReactNode;
}

export type SearchProviderState = {
  formValues: AdvancedSearchOptions;
  search: (query: string) => Promise<void>;
  advancedSearch: (query: string, options: AdvancedSearchOptions) => Promise<void>;
  isSearching: boolean;
  results: ISongWithRole[];
}

const initialState: SearchProviderState = {
  formValues: {} as AdvancedSearchOptions,
  search: () => Promise.resolve(),
  advancedSearch: () => Promise.resolve(),
  isSearching: false,
  results: [],
}

const SearchContext = createContext<SearchProviderState>(initialState);

export const SearchProvider = ({ songsService, children }: SearchProviderProps) => {
  const [results, setResults] = useState<ISongWithRole[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  try {
    const storedFormValues = localStorage.getItem('advancedSearchOptions');
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
    localStorage.setItem('advancedSearchOptions', JSON.stringify(values));
  };

  const search = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await songsService.advancedSearch({ query });
      setResults(response);
    } finally {
      setIsSearching(false);
    }
  };

  const advancedSearch = async (query: string, options: AdvancedSearchOptions) => {
    setIsSearching(true);
    setAndStoreFormValues(options);

    const curLang = (i18next.resolvedLanguage || 'en') as SupportedLanguage;
    try {
      const response = await songsService.advancedSearch({
        query: query,
        queryLanguage: curLang ?? undefined,
        languages: options.languages,
        organizations: options.organizations,
        searchPublicArchive: options.searchPublicArchive,
      });
      setResults(response);
    } finally {
      setIsSearching(false);
    }
  };

  const value = useMemo(() => {
    return {
      formValues,
      search,
      isSearching,
      advancedSearch,
      results,
    };
  }, [isSearching, results]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
  return useContext(SearchContext);
};
