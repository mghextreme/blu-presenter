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
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import QueueListIcon from "@heroicons/react/24/outline/QueueListIcon";
import { IUserIdentitiesResponse } from "@/types/auth";

interface SpotifyConnectionProps {
  identities: IUserIdentitiesResponse;
  onIdentitiesChanged: (identities: IUserIdentitiesResponse) => void;
  onBusyChange?: (busy: boolean) => void;
}

type PendingAction = 'signIn' | 'playlists';

export function SpotifyConnection({
  identities,
  onIdentitiesChanged,
  onBusyChange,
}: Readonly<SpotifyConnectionProps>) {
  const { t } = useTranslation("profile");
  const queryClient = useQueryClient();
  const { spotifyService, authService } = useServices();

  const [pending, setPending] = useState<PendingAction | null>(null);
  const isLoading = pending !== null;

  const spotifyIdentity = identities.identities.find(i => i.provider === 'spotify');

  const { data: status } = useQuery({ ...spotifyService.getStatusQuery(), retry: false });

  // Sign-in is always offered; playlists are an opt-in feature, kept visible
  // for users who already connected so they can still disconnect.
  const showPlaylists = !!status?.playlistsEnabled || !!status?.connected;
  const playlistsAccount = status?.connected
    ? status.accountName || status.accountId
    : null;

  const start = (action: PendingAction) => {
    onBusyChange?.(true);
    setPending(action);
  };
  const stop = () => {
    setPending(null);
    onBusyChange?.(false);
  };

  const onConnectSignIn = async () => {
    try {
      start('signIn');
      const redirectData = await authService.linkIdentity('spotify');
      localStorage.setItem('link-identity-code-verifier', redirectData.codeVerifier);

      setTimeout(() => {
        window.open(redirectData.url, '_self');
      }, 500);
    } catch (e: any) {
      toast.error(t('connectedAccounts.connectFailed'), {
        description: await describeApiError(e),
      });
      stop();
    }
  };

  const onDisconnectSignIn = async () => {
    if (!spotifyIdentity) return;

    try {
      start('signIn');
      await authService.unlinkIdentity(spotifyIdentity.identityId);
      toast.success(t('connectedAccounts.disconnected'));
      const updated = await authService.getIdentities();
      onIdentitiesChanged(updated);
    } catch (e: any) {
      toast.error(t('connectedAccounts.disconnectFailed'), {
        description: await describeApiError(e),
      });
    } finally {
      stop();
    }
  };

  const onConnectPlaylists = async () => {
    try {
      start('playlists');
      const { url } = await spotifyService.getConnectUrl();
      setTimeout(() => {
        window.open(url, '_self');
      }, 500);
    } catch (e: any) {
      toast.error(t('spotify.connectFailed'), {
        description: await describeApiError(e),
      });
      stop();
    }
  };

  const onDisconnectPlaylists = async () => {
    try {
      start('playlists');
      await spotifyService.disconnect();
      toast.success(t('spotify.disconnected'));
      await queryClient.invalidateQueries({ queryKey: ['spotify'] });
    } catch (e: any) {
      toast.error(t('spotify.disconnectFailed'), {
        description: await describeApiError(e),
      });
    } finally {
      stop();
    }
  };

  return (
    <div className="rounded-lg border divide-y">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <SpotifyIcon className="size-5" />
          <div>
            <p className="font-medium">Spotify</p>
            {spotifyIdentity?.email && (
              <p className="text-sm text-muted-foreground">{spotifyIdentity.email}</p>
            )}
          </div>
        </div>
        {spotifyIdentity ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                {t('connectedAccounts.disconnect')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('spotify.confirmUnlinkSignIn.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('spotify.confirmUnlinkSignIn.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('connectedAccounts.confirmDisconnect.cancel')}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDisconnectSignIn}>
                  {t('connectedAccounts.confirmDisconnect.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button variant="outline" size="sm" disabled={isLoading} onClick={onConnectSignIn}>
            {pending === 'signIn' && (
              <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
            )}
            {t('connectedAccounts.connect')}
          </Button>
        )}
      </div>

      {showPlaylists && (
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <QueueListIcon className="size-5" />
            <div>
              <p className="font-medium">{t('spotify.playlists')}</p>
              {playlistsAccount && (
                <p className="text-sm text-muted-foreground">{playlistsAccount}</p>
              )}
            </div>
          </div>
          {status?.connected ? (
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
                  <AlertDialogAction variant="destructive" onClick={onDisconnectPlaylists}>
                    {t('connectedAccounts.confirmDisconnect.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="outline" size="sm" disabled={isLoading} onClick={onConnectPlaylists}>
              {pending === 'playlists' && (
                <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
              )}
              {t('connectedAccounts.connect')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
