import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { ApiError } from '@/types';

import { CopyThemeToOrganization } from '../copy-theme-to-organization';

const authState = vi.hoisted(() => ({ organizations: [] as any[] }));
const themesService = vi.hoisted(() => ({ copyToOrganization: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => authState }));
vi.mock('@/hooks/useServices', () => ({ useServices: () => ({ themesService }) }));
vi.mock('sonner', () => ({ toast }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

describe('CopyThemeToOrganization', () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  beforeEach(() => {
    vi.clearAllMocks();
    authState.organizations = [
      { id: 1, name: 'Source', role: 'owner' },
      { id: 2, name: 'Themes off', role: 'admin', disabledFeatures: ['themes'] },
      { id: 3, name: 'Guest only', role: 'guest' },
      { id: 4, name: 'Target', role: 'member', disabledFeatures: ['sessions'] },
    ];
  });

  const openOrgList = async () => {
    render(<CopyThemeToOrganization themeId={9} name="My theme" sourceOrgId={1} />);
    await user.click(screen.getByTitle('actions.copyToOrganization'));
    await user.click(screen.getByRole('combobox'));
  };

  it('offers only organizations with themes enabled where the user is a member', async () => {
    await openOrgList();

    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Source', 'Target']);
  });

  it("shows the API's error message when the copy fails", async () => {
    themesService.copyToOrganization.mockRejectedValue(
      new ApiError(
        403,
        'API Error: 403',
        new Response(JSON.stringify({ message: 'Themes are disabled' })),
      ),
    );
    await openOrgList();
    await user.click(screen.getByRole('option', { name: 'Target' }));
    await user.click(screen.getByText('button.confirm'));

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('error.copyToOrganization', {
        description: 'Themes are disabled',
      }),
    );
    expect(themesService.copyToOrganization).toHaveBeenCalledWith(9, 4, 1);
  });
});
