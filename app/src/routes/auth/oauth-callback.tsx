import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import ArrowPathIcon from '@heroicons/react/24/solid/ArrowPathIcon';
import { toast } from 'sonner';

import { useServices } from '@/hooks/useServices';
import { describeApiError } from '@/types';
import { IAuthInvitationData, IExchangeCodeData } from '@/types/auth';
import { STORAGE_KEYS } from '@/lib/storage-keys';

const CODE_VERIFIER_KEY = 'auth-token-code-verifier';

function readStoredInvite(): IAuthInvitationData | undefined {
  const rawInvite = localStorage.getItem(STORAGE_KEYS.authInvite);
  if (!rawInvite) return undefined;
  try {
    return JSON.parse(rawInvite) as IAuthInvitationData;
  } catch {
    return undefined;
  }
}

/**
 * Supabase redirects back here after an OAuth sign-in. Exchanges the code
 * for a session (accepting a pending invitation, if any) and enters the app;
 * on any failure, returns to the login page with an error.
 */
export function OAuthCallback() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { authService } = useServices();
  // The code can only be exchanged once: guard against effects running twice
  // (React.StrictMode) or re-running on re-renders.
  const startedRef = useRef(false);

  const [params] = useSearchParams();
  const code = params.get('code');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const fail = async (description?: string) => {
      localStorage.removeItem(CODE_VERIFIER_KEY);
      toast.error(t('errors.oauth'), { description });
      await navigate('/login', { replace: true });
    };

    const run = async () => {
      const codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY);
      if (!code || !codeVerifier) {
        await fail();
        return;
      }

      const payload: IExchangeCodeData = { code, codeVerifier };
      const invite = readStoredInvite();
      if (invite) {
        payload.invite = invite;
      }

      try {
        await authService.exchangeCodeForSession(payload);
      } catch (e) {
        await fail(await describeApiError(e));
        return;
      }
      localStorage.removeItem(CODE_VERIFIER_KEY);
      localStorage.removeItem(STORAGE_KEYS.authInvite);

      // Timeout prevents users from briefly seeing the React Router error layout
      setTimeout(async () => {
        await navigate('/app', { replace: true });
      }, 100);
    };

    void run();
  }, [t, navigate, authService, code]);

  return (
    <div className="flex flex-col space-y-6 text-center items-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t('signIn.signingIn')}</h1>
      <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
    </div>
  );
}
