import { describe, it, expect, vi, beforeEach, afterEach } from 'vite-plus/test';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';
import { SongsService } from '@/services';
import { PAGE_SIZE } from '@/lib/pagination';
import { ISongWithRole } from '@/types';

import { SearchProvider } from '../search.provider';
import { useSearch } from '../useSearch';

const fetchMock = vi.fn();

function songs(prefix: string, count: number): ISongWithRole[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `${prefix} ${index + 1}`,
  }));
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function requestBodies() {
  return fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body));
}

function renderSearch(props: { defaultValue?: ISongWithRole[] } = {}) {
  const queryClient = createTestQueryClient();
  const songsService = new SongsService(queryClient, { url: 'http://api.test' });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SearchProvider songsService={songsService} {...props}>
        {children}
      </SearchProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useSearch(), { wrapper });
}

const titles = (results: ISongWithRole[]) => results.map((song) => song.title);

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SearchProvider', () => {
  it('shows the first page loaded by the route without requesting it again', () => {
    const { result } = renderSearch({ defaultValue: songs('Loaded', 2) });

    expect(titles(result.current.results)).toEqual(['Loaded 1', 'Loaded 2']);
    expect(result.current.hasMore).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not search until asked when there is no first page', () => {
    const { result } = renderSearch();

    expect(result.current.results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the latest search's results even when an earlier search answers last", async () => {
    let answerSlowSearch: (response: Response) => void = () => {};
    fetchMock.mockImplementation((_url, init) => {
      if (JSON.parse(init.body).query === 'slow') {
        return new Promise<Response>((resolve) => {
          answerSlowSearch = resolve;
        });
      }
      return Promise.resolve(jsonResponse(songs('Fast', 1)));
    });
    const { result } = renderSearch();

    let slowSearch: Promise<void> = Promise.resolve();
    act(() => {
      slowSearch = result.current.search('slow', false);
    });
    await act(() => result.current.search('fast', false));
    await act(async () => {
      answerSlowSearch(jsonResponse(songs('Slow', 1)));
      await slowSearch;
    });

    expect(titles(result.current.results)).toEqual(['Fast 1']);
  });

  it('appends the next page when loading more', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(songs('Next', 3))));
    const { result } = renderSearch({ defaultValue: songs('First', PAGE_SIZE) });
    expect(result.current.hasMore).toBe(true);

    await act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.results).toHaveLength(PAGE_SIZE + 3));
    expect(result.current.hasMore).toBe(false);
    expect(requestBodies()[0]).toMatchObject({ page: 2, itemsPerPage: PAGE_SIZE });
  });

  it('rejects when the search fails', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 500 })));
    const { result } = renderSearch();

    await act(async () => {
      await expect(result.current.search('query', false)).rejects.toThrow('API Error: 500');
    });
  });

  it('keeps the last search when the organization filter changes', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(songs('Song', 1))));
    const { result } = renderSearch();

    await act(() => result.current.advancedSearch('amazing', { languages: ['en'] }));
    await act(() => result.current.setOrganizationFilter({ organizations: [7] }));

    expect(requestBodies()[1]).toMatchObject({
      query: 'amazing',
      languages: ['en'],
      organizations: [7],
      page: 1,
    });
  });

  it('clears the stored languages, the query and the organization filter on reset', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(songs('Song', 1))));
    const { result } = renderSearch();

    await act(() => result.current.setOrganizationFilter({ organizations: [7] }));
    await act(() => result.current.advancedSearch('amazing', { languages: ['en'] }));
    expect(result.current.formValues).toEqual({ languages: ['en'] });

    await act(() => result.current.resetFilters());

    expect(result.current.formValues).toEqual({});
    expect(result.current.filtersResetAt).toBe(1);
    const lastRequest = requestBodies().at(-1);
    expect(lastRequest).not.toHaveProperty('query');
    expect(lastRequest).not.toHaveProperty('languages');
    expect(lastRequest).not.toHaveProperty('organizations');
  });

  it('restores the languages stored by a previous advanced search', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse([])));
    const first = renderSearch();
    await act(() => first.result.current.advancedSearch(undefined, { languages: ['pt'] }));
    first.unmount();

    const { result } = renderSearch();

    await waitFor(() => expect(result.current.formValues).toEqual({ languages: ['pt'] }));
  });
});
