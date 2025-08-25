import { SongsService } from "@/services";
import { ISongWithRole, SupportedLanguage } from "@/types";
import { createContext, useContext, useState } from "react";

export type AdvancedSearchOptions = {
  query: string;
  languages?: SupportedLanguage[];
  organizations?: number[];
  searchPublicArchive?: boolean;
}

type SearchProviderProps = {
  songsService: SongsService;
  children?: React.ReactNode;
}

export type SearchProviderState = {
  search: (query: string) => Promise<void>;
  advancedSearch: (options: AdvancedSearchOptions) => Promise<void>;
  isSearching: boolean;
  results: ISongWithRole[];
}

const initialState: SearchProviderState = {
  search: () => Promise.resolve(),
  advancedSearch: () => Promise.resolve(),
  isSearching: false,
  results: [],
}

const SearchContext = createContext<SearchProviderState>(initialState);

export const SearchProvider = ({ songsService, children }: SearchProviderProps) => {
  const [results, setResults] = useState<ISongWithRole[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const search = async (query: string) => {
    setIsSearching(true);
    const response = await songsService.advancedSearch({ query });
    setResults(response);
    setIsSearching(false);
  };

  const advancedSearch = async (options: AdvancedSearchOptions) => {
    setIsSearching(true);
    const response = await songsService.advancedSearch({
      query: options.query,
      languages: options.languages,
      organizations: options.organizations,
      searchPublicArchive: options.searchPublicArchive,
    });
    setResults(response);
    setIsSearching(false);
  };

  const value = {
    search,
    isSearching,
    advancedSearch,
    results,
  };
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
  return useContext(SearchContext);
};
