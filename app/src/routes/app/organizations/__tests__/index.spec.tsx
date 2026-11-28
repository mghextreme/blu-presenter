import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import { Suspense } from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { createTestQueryClient, render } from '@/test/test-utils';
import { IOrganization } from '@/types';

import { EditOrganization } from '../index';

const fetchOrganizationMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useServices', () => ({
  useServices: () => ({
    organizationsService: {
      currentQuery: (orgId: number) => ({
        queryKey: ['organizations', 'self', orgId],
        queryFn: () => fetchOrganizationMock(orgId),
      }),
    },
    authService: {},
  }),
}));

const useAuthMock = vi.hoisted(() => {
  const fn: any = () => ({
    user: null,
    setOrganizationById: vi.fn(),
    organizations: [],
  });
  fn.getState = () => ({
    user: null,
    setOrganizationById: vi.fn(),
    organizations: [],
  });
  return { current: fn };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: useAuthMock.current,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const organizations: Record<number, IOrganization> = {
  1: { id: 1, name: 'Org A', role: 'admin', users: [], invitations: [], disabledFeatures: [] },
  2: { id: 2, name: 'Org B', role: 'admin', users: [], invitations: [], disabledFeatures: [] },
};

const renderExistingOrganization = () => {
  const queryClient = createTestQueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/app/organization/1']}>
        <Link to="/app/organization/2">switch</Link>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/app/organization/:orgId" element={<EditOrganization />} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return queryClient;
};

describe('EditOrganization', () => {
  beforeEach(() => {
    fetchOrganizationMock.mockImplementation(async (orgId: number) => organizations[orgId]);
  });

  it('renders the creation form when no organization is loaded (add mode)', () => {
    // Regression test: the add route has no organization to load. The
    // component must not assume loaded data is present.
    render(
      <MemoryRouter>
        <EditOrganization edit={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText('input.name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'button.add' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'button.cancel' })).toBeInTheDocument();
  });

  it('keeps unsaved edits when the organization is refetched', async () => {
    const queryClient = renderExistingOrganization();

    const nameInput = await screen.findByDisplayValue('Org A');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Renamed');

    fetchOrganizationMock.mockResolvedValueOnce({
      ...organizations[1],
      users: [{ id: 2, name: 'New member', email: 'new@example.com', role: 'member' }],
    });
    await act(() => queryClient.invalidateQueries());

    expect(await screen.findByText('New member')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Renamed')).toBeInTheDocument();
  });

  it("shows the other organization's values when switching organizations", async () => {
    renderExistingOrganization();

    const nameInput = await screen.findByDisplayValue('Org A');
    await userEvent.type(nameInput, ' edited');
    await userEvent.click(screen.getByRole('link', { name: 'switch' }));

    expect(await screen.findByDisplayValue('Org B')).toBeInTheDocument();
  });
});
