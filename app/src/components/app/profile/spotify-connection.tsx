import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useServices } from "@/hooks/useServices";
import { describeApiError } from "@/types";
import { SpotifyIcon } from "@/components/logos/spotify";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { IUserIdentitiesResponse } from "@/types/auth";

interface SpotifyConnectionProps {
  identities: IUserIdentitiesResponse;
  onIdentitiesChanged: (identities: IUserIdentitiesResponse) => void;
  onBusyChange?: (busy: boolean) => void;
}

export function SpotifyConnection({
  identities,
  onIdentitiesChanged,
  onBusyChange,
}: Readonly<SpotifyConnectionProps>) {
  const { t } = useTranslation("profile");
  const queryClient = useQueryClient();
  const { spotifyService, authService } = useServices();

  const [isLoading, setLoading] = useState<boolean>(false);

  const spotifyIdentity = identities.identities.find(i => i.provider === 'spotify');

  const { data: status } = useQuery(spotifyService.getStatusQuery());

  const setBusy = (busy: boolean) => onBusyChange?.(busy);

  const onConnect = async () => {
    try {
      setBusy(true);
      setLoading(true);
      const { url } = await spotifyService.getConnectUrl();
      setTimeout(() => {
        window.open(url, '_self');
      }, 500);
    } catch (e: any) {
      toast.error(t('spotify.connectFailed'), {
        description: await describeApiError(e),
      });
      setLoading(false);
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    try {
      setBusy(true);
      setLoading(true);
      await spotifyService.disconnect();
      toast.success(t('spotify.disconnected'));
      await queryClient.invalidateQueries({ queryKey: ['spotify'] });
    } catch (e: any) {
      toast.error(t('spotify.disconnectFailed'), {
        description: await describeApiError(e),
      });
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  const onLinkIdentity = async () => {
    try {
      setBusy(true);
      setLoading(true);
      const redirectData = await authService.linkIdentity('spotify');
      localStorage.setItem('link-identity-code-verifier', redirectData.codeVerifier);

      setTimeout(() => {
        window.open(redirectData.url, '_self');
      }, 300);
    } catch (e: any) {
      toast.error(t('connectedAccounts.connectFailed'), {
        description: await describeApiError(e),
      });
      setLoading(false);
      setBusy(false);
    }
  };

  const onUnlinkIdentity = async () => {
    if (!spotifyIdentity) return;

    try {
      setBusy(true);
      setLoading(true);
      await authService.unlinkIdentity(spotifyIdentity.identityId);
      toast.success(t('connectedAccounts.disconnected'));
      const updated = await authService.getIdentities();
      onIdentitiesChanged(updated);
    } catch (e: any) {
      toast.error(t('connectedAccounts.disconnectFailed'), {
        description: await describeApiError(e),
      });
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <SpotifyIcon className="size-5" />
        <div>
          <p className="font-medium">Spotify</p>
          {status?.connected ? (
            <p className="text-sm text-muted-foreground">
              {t('spotify.connectedAs', { name: status.spotifyDisplayName || status.spotifyUserId })}
              {spotifyIdentity && ' · ' + t('spotify.signInEnabled')}
            </p>
          ) : spotifyIdentity ? (
            <p className="text-sm text-muted-foreground">{t('spotify.signInEnabled')}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{t('spotify.description')}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {status?.connected ? (
          <>
            {!spotifyIdentity && (
              <Button variant="secondary" size="sm" disabled={isLoading} onClick={onLinkIdentity}>
                {t('spotify.enableSignIn')}
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                  {t('connectedAccounts.disconnect')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('spotify.confirmDisconnect.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('spotify.confirmDisconnect.description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('connectedAccounts.confirmDisconnect.cancel')}</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={onDisconnect}>
                    {t('connectedAccounts.confirmDisconnect.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <>
            {spotifyIdentity && (
              <Button variant="outline" size="sm" disabled={isLoading} onClick={onUnlinkIdentity}>
                {t('spotify.unlinkSignIn')}
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={isLoading} onClick={onConnect}>
              {t('connectedAccounts.connect')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
