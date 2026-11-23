import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { toast } from "sonner";

import { useServices } from "@/hooks/useServices";
import { PlaylistIntegrationService } from "@/services";

interface PlaylistConnectCallbackProps {
  service: PlaylistIntegrationService;
  /** i18n key prefix (profile namespace) holding the provider's strings. */
  i18nPrefix: string;
  /**
   * Runs after the connection is stored. Returns true when it navigated away
   * (e.g. to chain another OAuth flow), so the callback doesn't redirect.
   */
  afterConnect?: () => Promise<boolean>;
}

/**
 * A playlist integration's OAuth consent screen redirects back here. Relays
 * the authorization code to the API (which exchanges it for tokens using the
 * client secret), then returns to the profile page.
 */
function PlaylistConnectCallback({
  service,
  i18nPrefix,
  afterConnect,
}: Readonly<PlaylistConnectCallbackProps>) {
  const { t } = useTranslation("profile");
  const navigate = useNavigate();
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
          title: t(`${i18nPrefix}.connectFailed`),
          description: t(`${i18nPrefix}.connectCancelled`),
        });
        return;
      }

      if (!code || !state) {
        finish({ type: 'error', title: t(`${i18nPrefix}.connectFailed`) });
        return;
      }

      try {
        await service.completeConnect(code, state);
      } catch {
        finish({ type: 'error', title: t(`${i18nPrefix}.connectFailed`) });
        return;
      }

      if (afterConnect && await afterConnect()) {
        return;
      }

      finish({ type: 'success', title: t(`${i18nPrefix}.connected`) });
    };

    run();
  }, [t, navigate, service, i18nPrefix, afterConnect, code, state, error]);

  return (
    <div className="flex flex-col space-y-6 text-center items-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t(`${i18nPrefix}.connecting`)}
      </h1>
      <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
    </div>
  );
}

export function SpotifyConnectCallback() {
  const { spotifyService, authService } = useServices();

  // Chain the Supabase identity link so the user can also sign in with
  // Spotify. Skipped when the identity is already linked.
  const linkSignIn = async (): Promise<boolean> => {
    try {
      const { identities } = await authService.getIdentities();
      if (identities.some((identity) => identity.provider === 'spotify')) {
        return false;
      }

      const redirectData = await authService.linkIdentity('spotify');
      localStorage.setItem('link-identity-code-verifier', redirectData.codeVerifier);
      setTimeout(() => {
        window.open(redirectData.url, '_self');
      }, 500);
      return true;
    } catch {
      // Tokens are already stored; the identity link can be retried later
      // from the Spotify card on the profile page.
      return false;
    }
  };

  return (
    <PlaylistConnectCallback service={spotifyService} i18nPrefix="spotify" afterConnect={linkSignIn} />
  );
}

/** YouTube only connects the API: signing in with Google is a separate
 * identity, managed on the Google card. */
export function YoutubeConnectCallback() {
  const { youtubeService } = useServices();
  return <PlaylistConnectCallback service={youtubeService} i18nPrefix="youtube" />;
}
