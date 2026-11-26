import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';

import { OAuthLinkCallback } from '../oauth-link-callback';

const useServicesMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useServices', () => ({
  useServices: useServicesMock,
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigateMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('OAuthLinkCallback', () => {
  const exchangeCodeForSession = vi.fn();

  const renderAt = (url: string) =>
    render(
      // StrictMode runs effects twice, like the dev build.
      <StrictMode>
        <MemoryRouter initialEntries={[url]}>
          <OAuthLinkCallback />
        </MemoryRouter>
      </StrictMode>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    exchangeCodeForSession.mockResolvedValue(undefined);
    useServicesMock.mockReturnValue({ authService: { exchangeCodeForSession } });
  });

  it('exchanges the code once and returns to the profile', async () => {
    localStorage.setItem('link-identity-code-verifier', 'verifier');

    renderAt('/oauth/link-callback?code=abc');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/app/profile', { replace: true });
    });
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(exchangeCodeForSession).toHaveBeenCalledWith({ code: 'abc', codeVerifier: 'verifier' });
    expect(toast.success).toHaveBeenCalledWith('connectedAccounts.linked', expect.anything());
    expect(localStorage.getItem('link-identity-code-verifier')).toBeNull();
  });

  it('returns to the profile with an error when the exchange fails', async () => {
    localStorage.setItem('link-identity-code-verifier', 'verifier');
    exchangeCodeForSession.mockRejectedValue(new Error('API Error: 400'));

    renderAt('/oauth/link-callback?code=abc');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/app/profile', { replace: true });
    });
    expect(toast.error).toHaveBeenCalledWith('connectedAccounts.linkError', expect.anything());
  });

  it('shows the error Supabase redirected with, without exchanging', async () => {
    localStorage.setItem('link-identity-code-verifier', 'verifier');

    renderAt(
      '/oauth/link-callback?error=server_error&error_description=Identity+is+already+linked+to+another+user',
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/app/profile', { replace: true });
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('connectedAccounts.linkError', {
      description: 'Identity is already linked to another user',
    });
  });

  it('fails cleanly when the code verifier is missing', async () => {
    renderAt('/oauth/link-callback?code=abc');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/app/profile', { replace: true });
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });
});
