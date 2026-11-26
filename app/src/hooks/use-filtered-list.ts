import { useMemo, useState } from "react";
import { keepPreviousData, QueryKey, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { PAGE_SIZE } from "@/lib/pagination";
import type { OptionalOrganization } from "@/components/app/organization-bar";
import { selectionToFilter, useOrganizationFilter } from "@/hooks/use-organization-filter";

/** Optional date range filter, as YYYY-MM-DD strings. */
export type FilteredListDateRange = { from: string | null; to: string | null } | null;

export type FilteredListSearchPayload = {
  organizations?: number[];
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  itemsPerPage: number;
};

interface UseFilteredListOptions<T> {
  /** Cache key of the listed resource (e.g. `['schedules']`); invalidating it refreshes the list. */
  queryKey: QueryKey;
  /** First page, already loaded by the route loader for the initial filters. */
  defaultValue?: T[];
  /** Organizations pre-selected on mount (restored from the persisted filter). */
  initialOrganizations?: OptionalOrganization[];
  search: (payload: FilteredListSearchPayload) => Promise<T[]>;
  onError?: (error: any) => void;
  /** Run a first search on mount (for lists without a route loader). */
  auto?: boolean;
}

export function useFilteredList<T>({ queryKey, defaultValue, initialOrganizations, search, onError, auto = false }: UseFilteredListOptions<T>) {
  const queryClient = useQueryClient();
  const [selectedOrganizations, setSelectedOrganizations] = useState<OptionalOrganization[]>(initialOrganizations ?? []);
  const [query, setQueryState] = useState<string>('');
  const [dateRange, setDateRangeState] = useState<FilteredListDateRange>(null);
  const [filtersChanged, setFiltersChanged] = useState<boolean>(false);

  const filters = {
    organizations: selectionToFilter(selectedOrganizations).organizations,
    query: query.length >= 2 ? query : undefined,
    dateFrom: dateRange?.from ?? undefined,
    dateTo: dateRange?.to ?? undefined,
  };
  const listKey = [...queryKey, 'list', filters];

  const list = useInfiniteQuery({
    queryKey: listKey,
    queryFn: async ({ pageParam }) => {
      try {
        return await search({ ...filters, page: pageParam, itemsPerPage: PAGE_SIZE });
      } catch (e) {
        onError?.(e);
        throw e;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined),
    initialData: !filtersChanged && defaultValue ? { pages: [defaultValue], pageParams: [1] } : undefined,
    enabled: auto || filtersChanged || defaultValue !== undefined,
    placeholderData: keepPreviousData,
  });

  const results = useMemo(() => list.data?.pages.flat() ?? [], [list.data]);

  const setOrganizations = (orgs: OptionalOrganization[]) => {
    setSelectedOrganizations(orgs);
    // Keep the shared, persisted filter in sync across list pages.
    useOrganizationFilter.getState().setFilter(selectionToFilter(orgs));
    setFiltersChanged(true);
  };

  const resetOrganizations = () => {
    setSelectedOrganizations([]);
    useOrganizationFilter.getState().reset();
    setFiltersChanged(true);
  };

  const setQuery = (value: string) => {
    setQueryState(value);
    setFiltersChanged(true);
  };

  const setDateRange = (range: FilteredListDateRange) => {
    setDateRangeState(range);
    setFiltersChanged(true);
  };

  /** Reloads from the first page with the current filters. */
  const refresh = () => {
    setFiltersChanged(true);
    void queryClient.resetQueries({ queryKey: listKey });
  };

  return {
    selectedOrganizations,
    setOrganizations,
    resetOrganizations,
    query,
    setQuery,
    dateRange,
    setDateRange,
    results,
    isLoading: list.isFetching,
    hasMore: list.hasNextPage,
    loadMore: () => void list.fetchNextPage(),
    refresh,
  };
}
