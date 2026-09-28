import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useFilteredList } from "../use-filtered-list";
import { useOrganizationFilter } from "../use-organization-filter";
import { PAGE_SIZE } from "@/lib/pagination";

const makeItems = (count: number, startId = 1) =>
  Array.from({ length: count }, (_, i) => ({ id: startId + i, title: `Item ${startId + i}` }));

describe("useFilteredList", () => {
  const buildSearchMock = () =>
    vi.fn(async () => makeItems(PAGE_SIZE));

  beforeEach(() => {
    useOrganizationFilter.getState().reset();
    localStorage.clear();
  });

  it("initializes results from the default value", () => {
    const defaultValue = makeItems(3);

    const { result } = renderHook(() =>
      useFilteredList({ defaultValue, search: buildSearchMock() }),
    );

    expect(result.current.results).toEqual(defaultValue);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.selectedOrganizations).toEqual([]);
  });

  it("marks hasMore when the default value fills a whole page", () => {
    const defaultValue = makeItems(PAGE_SIZE);

    const { result } = renderHook(() =>
      useFilteredList({ defaultValue, search: buildSearchMock() }),
    );

    expect(result.current.hasMore).toBe(true);
  });

  it("searches with the selected organizations and resets to page 1", async () => {
    const search = buildSearchMock();

    const { result } = renderHook(() =>
      useFilteredList({ search }),
    );

    await act(async () => {
      result.current.setOrganizations([{ id: 5, name: "Org" }]);
    });

    expect(search).toHaveBeenCalledWith({
      organizations: [5],
      page: 1,
      itemsPerPage: PAGE_SIZE,
    });
    expect(result.current.selectedOrganizations).toEqual([{ id: 5, name: "Org" }]);
  });

  it("treats an empty organization selection as all organizations", async () => {
    const search = buildSearchMock();

    const { result } = renderHook(() =>
      useFilteredList({ search }),
    );

    await act(async () => {
      result.current.setOrganizations([]);
    });

    expect(search).toHaveBeenCalledWith({
      page: 1,
      itemsPerPage: PAGE_SIZE,
    });
  });

  it("ignores queries shorter than two characters", async () => {
    const search = buildSearchMock();

    const { result } = renderHook(() =>
      useFilteredList({ search }),
    );

    await act(async () => {
      result.current.setQuery('a');
    });

    expect(search).toHaveBeenCalledWith(
      expect.not.objectContaining({ query: expect.anything() }),
    );

    await act(async () => {
      result.current.setQuery('ab');
    });

    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 'ab' }),
    );
  });

  it("appends results when loading more", async () => {
    const page1 = makeItems(PAGE_SIZE, 1);
    const page2 = makeItems(PAGE_SIZE, PAGE_SIZE + 1);
    const search = vi.fn()
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    const { result } = renderHook(() =>
      useFilteredList({ search }),
    );

    await act(async () => {
      result.current.setOrganizations([]);
    });
    expect(result.current.results).toEqual(page1);

    await act(async () => {
      result.current.loadMore();
    });

    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );
    expect(result.current.results).toEqual([...page1, ...page2]);
  });

  it("stops offering more results when a page is not full", async () => {
    const search = vi.fn()
      .mockResolvedValueOnce(makeItems(PAGE_SIZE))
      .mockResolvedValueOnce(makeItems(10));

    const { result } = renderHook(() =>
      useFilteredList({ search }),
    );

    await act(async () => {
      result.current.setOrganizations([]);
    });
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      result.current.loadMore();
    });
    expect(result.current.hasMore).toBe(false);
  });

  it("refreshes back to page 1 with the current filters", async () => {
    const search = vi.fn()
      .mockResolvedValueOnce(makeItems(PAGE_SIZE))
      .mockResolvedValueOnce(makeItems(PAGE_SIZE, PAGE_SIZE + 1))
      .mockResolvedValueOnce(makeItems(5));

    const { result } = renderHook(() =>
      useFilteredList({ search }),
    );

    await act(async () => {
      result.current.setOrganizations([{ id: 7, name: "Org" }]);
    });
    await act(async () => {
      result.current.loadMore();
    });

    await act(async () => {
      result.current.refresh();
    });

    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ organizations: [7], page: 1 }),
    );
    expect(result.current.results).toHaveLength(5);
  });

  it("reports errors through the onError callback", async () => {
    const onError = vi.fn();
    const search = vi.fn().mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() =>
      useFilteredList({ search, onError }),
    );

    await act(async () => {
      result.current.setOrganizations([]);
    });

    expect(onError).toHaveBeenCalled();
  });

  it("syncs organization changes to the persisted shared filter", async () => {
    const { result } = renderHook(() =>
      useFilteredList({ search: buildSearchMock() }),
    );

    await act(async () => {
      result.current.setOrganizations([{ id: 5, name: "Org" }, null]);
    });

    const state = useOrganizationFilter.getState();
    expect(state.organizations).toEqual([5]);
    expect(state.searchPublicArchive).toBe(true);

    await act(async () => {
      result.current.setOrganizations([]);
    });

    expect(useOrganizationFilter.getState().organizations).toBeUndefined();
    expect(useOrganizationFilter.getState().searchPublicArchive).toBe(false);
  });

  it("restores the selection from initialOrganizations and keeps it for pagination", async () => {
    const search = buildSearchMock();
    const initialOrganizations = [{ id: 5, name: "Org" }];

    const { result } = renderHook(() =>
      useFilteredList({ search, initialOrganizations }),
    );

    expect(result.current.selectedOrganizations).toEqual(initialOrganizations);

    await act(async () => {
      result.current.loadMore();
    });

    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ organizations: [5], page: 2 }),
    );
  });

  it("clears the persisted filter when resetting organizations", async () => {
    const search = buildSearchMock();

    const { result } = renderHook(() =>
      useFilteredList({ search, initialOrganizations: [{ id: 5, name: "Org" }] }),
    );

    await act(async () => {
      result.current.resetOrganizations();
    });

    expect(result.current.selectedOrganizations).toEqual([]);
    expect(useOrganizationFilter.getState().organizations).toBeUndefined();
    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 }),
    );
    expect(search).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ organizations: expect.anything() }),
    );
  });
});
