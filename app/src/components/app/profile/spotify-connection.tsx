import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
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
}

export function SpotifyConnection({
  identities,
}: Readonly<SpotifyConnectionProps>) {
  const { t } = useTranslation("profile");
  const { spotifyService, authService } = useServices();

  const spotifyIdentity = identities.identities.find(i => i.provider === 'spotify');

  const { data: status } = useQuery({ ...spotifyService.getStatusQuery(), retry: false });

  // Sign-in is always offered; playlists are an opt-in feature, kept visible
  // for users who already connected so they can still disconnect.
  const showPlaylists = !!status?.playlistsEnabled || !!status?.connected;
  const playlistsAccount = status?.connected
    ? status.accountName || status.accountId
    : null;

  const connectSignIn = useMutation({
    mutationFn: () => authService.linkIdentity('spotify'),
    onSuccess: (redirectData) => {
      localStorage.setItem('link-identity-code-verifier', redirectData.codeVerifier);

      setTimeout(() => {
        window.open(redirectData.url, '_self');
      }, 500);
    },
    onError: async (e) => {
      toast.error(t('connectedAccounts.connectFailed'), {
        description: await describeApiError(e),
      });
    },
  });

  const disconnectSignIn = useMutation({
    mutationFn: (identityId: string) => authService.unlinkIdentity(identityId),
    onSuccess: () => {
      toast.success(t('connectedAccounts.disconnected'));
    },
    onError: async (e) => {
      toast.error(t('connectedAccounts.disconnectFailed'), {
        description: await describeApiError(e),
      });
    },
  });

  const connectPlaylists = useMutation({
    mutationFn: () => spotifyService.getConnectUrl(),
    onSuccess: ({ url }) => {
      setTimeout(() => {
        window.open(url, '_self');
      }, 500);
    },
    onError: async (e) => {
      toast.error(t('spotify.connectFailed'), {
        description: await describeApiError(e),
      });
    },
  });

  const disconnectPlaylists = useMutation({
    mutationFn: () => spotifyService.disconnect(),
    onSuccess: () => {
      toast.success(t('spotify.disconnected'));
    },
    onError: async (e) => {
      toast.error(t('spotify.disconnectFailed'), {
        description: await describeApiError(e),
      });
    },
  });

  // A successful connect stays busy: the page is about to redirect to the provider.
  const isSignInBusy = connectSignIn.isPending || connectSignIn.isSuccess || disconnectSignIn.isPending;
  const isPlaylistsBusy = connectPlaylists.isPending || connectPlaylists.isSuccess || disconnectPlaylists.isPending;
  const isLoading = isSignInBusy || isPlaylistsBusy;

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
                <AlertDialogAction variant="destructive" onClick={() => disconnectSignIn.mutate(spotifyIdentity.identityId)}>
                  {t('connectedAccounts.confirmDisconnect.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button variant="outline" size="sm" disabled={isLoading} onClick={() => connectSignIn.mutate()}>
            {isSignInBusy && (
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
                  <AlertDialogAction variant="destructive" onClick={() => disconnectPlaylists.mutate()}>
                    {t('connectedAccounts.confirmDisconnect.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="outline" size="sm" disabled={isLoading} onClick={() => connectPlaylists.mutate()}>
              {isPlaylistsBusy && (
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
