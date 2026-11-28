import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';

import { OAuthCallback } from '../oauth-callback';
import { STORAGE_KEYS } from '@/lib/storage-keys';

const useServicesMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useServices', () => ({
  useServices: useServicesMock,
}));

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
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

describe('OAuthCallback', () => {
  const exchangeCodeForSession = vi.fn();

  const renderAt = (url: string) =>
    render(
      // StrictMode runs effects twice, like the dev build.
      <StrictMode>
        <MemoryRouter initialEntries={[url]}>
          <OAuthCallback />
        </MemoryRouter>
      </StrictMode>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    exchangeCodeForSession.mockResolvedValue(undefined);
    useServicesMock.mockReturnValue({ authService: { exchangeCodeForSession } });
  });

  it('exchanges the code once, with the pending invitation, and enters the app', async () => {
    localStorage.setItem('auth-token-code-verifier', 'verifier');
    localStorage.setItem(STORAGE_KEYS.authInvite, JSON.stringify({ id: 3, secret: 's' }));

    renderAt('/oauth/callback?code=abc');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/app', { replace: true });
    });
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(exchangeCodeForSession).toHaveBeenCalledWith({
      code: 'abc',
      codeVerifier: 'verifier',
      invite: { id: 3, secret: 's' },
    });
    expect(localStorage.getItem('auth-token-code-verifier')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.authInvite)).toBeNull();
  });

  it('returns to the login page with an error when the exchange fails', async () => {
    localStorage.setItem('auth-token-code-verifier', 'verifier');
    exchangeCodeForSession.mockRejectedValue(new Error('API Error: 400'));

    renderAt('/oauth/callback?code=abc');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    });
    expect(toast.error).toHaveBeenCalledWith('errors.oauth', expect.anything());
  });

  it('returns to the login page without a code, without exchanging', async () => {
    localStorage.setItem('auth-token-code-verifier', 'verifier');

    renderAt('/oauth/callback');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('errors.oauth', expect.anything());
  });
});
