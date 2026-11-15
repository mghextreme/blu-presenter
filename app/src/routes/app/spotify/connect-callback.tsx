import { useTranslation } from "react-i18next";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { useServices } from "@/hooks/useServices";

/**
 * Spotify redirects back here after the user consents to the connect flow.
 * Relays the authorization code to the API (which exchanges it for tokens
 * using the client secret), then chains the Supabase identity link so the
 * user can also sign in with Spotify.
 */
export function SpotifyConnectCallback() {
  const { t } = useTranslation("profile");
  const navigate = useNavigate();
  const { spotifyService, authService } = useServices();
  const startedRef = useRef(false);

  const [params] = useSearchParams();
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const finish = (message?: { type: 'success' | 'error'; title: string; description?: string }) => {
      setTimeout(async () => {
        if (message) {
          if (message.type === 'success') {
            toast.success(message.title, { description: message.description });
          } else {
            toast.error(message.title, { description: message.description });
          }
        }
        await navigate('/app/profile', { replace: true });
      }, 100);
    };

    const run = async () => {
      if (error) {
        finish({
          type: 'error',
          title: t('spotify.connectFailed'),
          description: t('spotify.connectCancelled'),
        });
        return;
      }

      if (!code || !state) {
        finish({ type: 'error', title: t('spotify.connectFailed') });
        return;
      }

      try {
        await spotifyService.completeConnect(code, state);
      } catch {
        finish({ type: 'error', title: t('spotify.connectFailed') });
        return;
      }

      // Chain the Supabase identity link so the user can also sign in with
      // Spotify. Skipped when the identity is already linked.
      try {
        const { identities } = await authService.getIdentities();
        if (!identities.some((identity) => identity.provider === 'spotify')) {
          const redirectData = await authService.linkIdentity('spotify');
          localStorage.setItem('link-identity-code-verifier', redirectData.codeVerifier);

          setTimeout(() => {
            window.open(redirectData.url, '_self');
          }, 500);
          return;
        }
      } catch {
        // Tokens are already stored; the identity link can be retried later
        // from the Spotify card on the profile page.
      }

      finish({ type: 'success', title: t('spotify.connected') });
    };

    run();
  }, [t, navigate, spotifyService, authService, code, state, error]);

  return (
    <div className="flex flex-col space-y-6 text-center items-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t('spotify.connecting')}
      </h1>
      <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
    </div>
  );
}
