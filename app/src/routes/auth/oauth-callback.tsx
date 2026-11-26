import { useTranslation } from 'react-i18next';
import ArrowPathIcon from '@heroicons/react/24/solid/ArrowPathIcon';
import { useServices } from '@/hooks/useServices';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { describeApiError } from '@/types';
import { IAuthInvitationData, IExchangeCodeData } from '@/types/auth';
import { useNavigate, useSearchParams } from 'react-router';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export function OAuthCallback() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();

  const [params] = useSearchParams();
  const code = params.get('code');
  const codeVerifier = localStorage.getItem('auth-token-code-verifier');

  if (!code || !codeVerifier) {
    throw new Error(t('errors.oauth'));
  }

  const { authService } = useServices();
  // The code can only be exchanged once: guard against effects running twice
  // (React.StrictMode) or re-running on re-renders.
  const startedRef = useRef(false);

  const rawInvite = localStorage.getItem(STORAGE_KEYS.authInvite);
  let invite: IAuthInvitationData | undefined = undefined;
  if (rawInvite) {
    try {
      invite = JSON.parse(rawInvite) as IAuthInvitationData;
    } catch (e) {
      console.log(e);
    }
  }

  const validateTokens = async () => {
    const payload = {
      code,
      codeVerifier,
    } as IExchangeCodeData;

    if (invite) {
      payload.invite = invite;
    }

    try {
      await authService.exchangeCodeForSession(payload);
    } catch (e) {
      localStorage.removeItem('auth-token-code-verifier');
      toast.error(t('errors.oauth'), { description: await describeApiError(e) });
      await navigate('/login', { replace: true });
      return;
    }
    localStorage.removeItem('auth-token-code-verifier');
    localStorage.removeItem(STORAGE_KEYS.authInvite);

    // Timeout prevents users from briefly seeing the React Router error layout
    setTimeout(async () => {
      await navigate('/app', { replace: true });
    }, 100);
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void validateTokens();
  });

  return (
    <>
      <div className="flex flex-col space-y-6 text-center items-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('signIn.signingIn')}</h1>
        <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
      </div>
    </>
  );
}
