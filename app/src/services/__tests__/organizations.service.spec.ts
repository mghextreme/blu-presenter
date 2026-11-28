import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { QueryObserver } from '@tanstack/react-query';
import { createAppQueryClient } from '@/lib/query-client';
import { useAuth } from '@/hooks/useAuth';
import { OrganizationsService } from '../organizations.service';

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

describe('OrganizationsService.leave', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useAuth.setState({ isLoggedIn: true, session: { access_token: 'a' } as never });
    fetchMock = vi.fn(async () => json({ id: 2, name: 'Other', users: [], invitations: [] }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('drops the left organization and refreshes the others, without refetching the left one', async () => {
    const queryClient = createAppQueryClient();
    const service = new OrganizationsService(queryClient, { url: 'http://api.test' });
    queryClient.setQueryData(['organizations', 'self', 1], { id: 1 });
    queryClient.setQueryData(['organizations', 1, 'members', 5], { id: 5 });
    queryClient.setQueryData(['organizations', 'self', 2], { id: 2 });
    // Mounted pages observe the current organization.
    const unsubscribe = new QueryObserver(queryClient, service.currentQuery(1)).subscribe(() => {});

    await service.leave(1);
    await vi.waitFor(() => expect(queryClient.isFetching()).toBe(0));

    expect(queryClient.getQueryData(['organizations', 'self', 1])).toBeUndefined();
    expect(queryClient.getQueryData(['organizations', 1, 'members', 5])).toBeUndefined();
    expect(queryClient.getQueryState(['organizations', 'self', 2])?.isInvalidated).toBe(true);
    const selfRequestsForLeftOrg = fetchMock.mock.calls.filter(
      ([url, init]) =>
        String(url).endsWith('/organizations/self') &&
        (init?.headers as Record<string, string>)?.Organization === '1',
    );
    expect(selfRequestsForLeftOrg).toHaveLength(0);
    unsubscribe();
  });
});
