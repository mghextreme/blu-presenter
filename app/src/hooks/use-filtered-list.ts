import { useRef, useState } from "react";
import { PAGE_SIZE } from "@/lib/pagination";
import type { OptionalOrganization } from "@/components/app/organization-bar";
import { selectionToFilter, useOrganizationFilter } from "@/hooks/use-organization-filter";

export type FilteredListSearchPayload = {
  organizations?: number[];
  query?: string;
  page: number;
  itemsPerPage: number;
};

interface UseFilteredListOptions<T> {
  defaultValue?: T[];
  /** Organizations pre-selected on mount (restored from the persisted filter). */
  initialOrganizations?: OptionalOrganization[];
  search: (payload: FilteredListSearchPayload) => Promise<T[]>;
  onError?: (error: any) => void;
}

export function useFilteredList<T>({ defaultValue, initialOrganizations, search, onError }: UseFilteredListOptions<T>) {
  const [selectedOrganizations, setSelectedOrganizations] = useState<OptionalOrganization[]>(initialOrganizations ?? []);
  const [query, setQueryState] = useState<string>('');
  const [results, setResults] = useState<T[]>(defaultValue ?? []);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>((defaultValue?.length ?? 0) === PAGE_SIZE);
  const [isLoading, setLoading] = useState<boolean>(false);

  // Latest request parameters, kept in a ref so that calls triggered in the
  // same tick as a filter change always see the latest values.
  const requestRef = useRef<{ organizations?: number[]; query?: string }>({
    organizations: selectionToFilter(initialOrganizations ?? []).organizations,
  });
  // Monotonic sequence to discard out-of-order responses.
  const sequenceRef = useRef<number>(0);

  const run = async (page: number, append: boolean) => {
    const sequence = ++sequenceRef.current;

    setLoading(true);
    try {
      const response = await search({
        ...requestRef.current,
        page,
        itemsPerPage: PAGE_SIZE,
      });

      if (sequence !== sequenceRef.current) {
        return;
      }

      setResults((prev) => append ? [...prev, ...response] : response);
      setHasMore(response.length === PAGE_SIZE);
    } catch (e) {
      if (sequence === sequenceRef.current) {
        onError?.(e);
      }
    } finally {
      if (sequence === sequenceRef.current) {
        setLoading(false);
      }
    }
  };

  const setOrganizations = (orgs: OptionalOrganization[]) => {
    setSelectedOrganizations(orgs);

    const filter = selectionToFilter(orgs);
    requestRef.current.organizations = filter.organizations;

    // Keep the shared, persisted filter in sync across list pages.
    useOrganizationFilter.getState().setFilter(filter);

    setPage(1);
    run(1, false);
  };

  const resetOrganizations = () => {
    setSelectedOrganizations([]);
    requestRef.current.organizations = undefined;
    useOrganizationFilter.getState().reset();

    setPage(1);
    run(1, false);
  };

  const setQuery = (value: string) => {
    setQueryState(value);
    requestRef.current.query = value.length >= 2 ? value : undefined;

    setPage(1);
    run(1, false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    run(nextPage, true);
  };

  const refresh = () => {
    setPage(1);
    run(1, false);
  };

  return {
    selectedOrganizations,
    setOrganizations,
    resetOrganizations,
    query,
    setQuery,
    results,
    isLoading,
    hasMore,
    loadMore,
    refresh,
  };
}
