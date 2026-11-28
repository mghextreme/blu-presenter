import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import ArrowPathIcon from '@heroicons/react/24/solid/ArrowPathIcon';
import { toast } from 'sonner';

import { useServices } from '@/hooks/useServices';
import { describeApiError } from '@/types';
import { IExchangeCodeData } from '@/types/auth';

const CODE_VERIFIER_KEY = 'link-identity-code-verifier';

/**
 * Supabase redirects back here after the user links an OAuth identity
 * (Google, Spotify) to their account. Exchanges the code for a session that
 * includes the new identity, then returns to the profile page.
 */
export function OAuthLinkCallback() {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const { authService } = useServices();
  // The code can only be exchanged once: guard against effects running twice
  // (React.StrictMode) or re-running on re-renders.
  const startedRef = useRef(false);

  const [params] = useSearchParams();
  const code = params.get('code');
  // Supabase reports failures (e.g. the identity already belongs to another
  // user) as query parameters, or in the hash for some flows.
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const error = params.get('error') ?? hashParams.get('error');
  const errorDescription = params.get('error_description') ?? hashParams.get('error_description');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const finish = (message: {
      type: 'success' | 'error';
      title: string;
      description?: string;
    }) => {
      localStorage.removeItem(CODE_VERIFIER_KEY);
      // Timeout prevents users from briefly seeing the React Router error layout
      setTimeout(async () => {
        if (message.type === 'success') {
          toast.success(message.title, { description: message.description });
        } else {
          toast.error(message.title, { description: message.description });
        }
        await navigate('/app/profile', { replace: true });
      }, 100);
    };

    const run = async () => {
      const codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY);

      if (error || !code || !codeVerifier) {
        finish({
          type: 'error',
          title: t('connectedAccounts.linkError'),
          description: errorDescription ?? undefined,
        });
        return;
      }

      try {
        await authService.exchangeCodeForSession({ code, codeVerifier } as IExchangeCodeData);
      } catch (e: any) {
        finish({
          type: 'error',
          title: t('connectedAccounts.linkError'),
          description: await describeApiError(e),
        });
        return;
      }

      finish({ type: 'success', title: t('connectedAccounts.linked') });
    };

    void run();
  }, [t, navigate, authService, code, error, errorDescription]);

  return (
    <div className="flex flex-col space-y-6 text-center items-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t('connectedAccounts.linking')}</h1>
      <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
    </div>
  );
}
