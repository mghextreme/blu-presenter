import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useServices } from "@/hooks/useServices";
import { describeApiError } from "@/types";
import { GoogleIcon } from "@/components/logos/google";
import { YouTubeIcon } from "@/components/logos/youtube";
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
import { IUserIdentitiesResponse } from "@/types/auth";

interface GoogleConnectionProps {
  identities: IUserIdentitiesResponse;
  onIdentitiesChanged: (identities: IUserIdentitiesResponse) => void;
  onBusyChange?: (busy: boolean) => void;
}

export function GoogleConnection({
  identities,
  onIdentitiesChanged,
  onBusyChange,
}: Readonly<GoogleConnectionProps>) {
  const { t } = useTranslation("profile");
  const queryClient = useQueryClient();
  const { authService, youtubeService } = useServices();

  const [pending, setPending] = useState<'google' | 'youtube' | null>(null);
  const isLoading = pending !== null;

  const googleIdentity = identities.identities.find(i => i.provider === 'google');

  const { data: youtubeStatus } = useQuery({ ...youtubeService.getStatusQuery(), retry: false });

  // Shown whenever the server has YouTube configured; also kept for users who
  // already connected so they can still disconnect.
  const showYoutube = !!youtubeStatus?.playlistsEnabled || !!youtubeStatus?.connected;
  const youtubeAccount = youtubeStatus?.connected
    ? youtubeStatus.accountName || youtubeStatus.accountId
    : null;

  const start = (action: 'google' | 'youtube') => {
    onBusyChange?.(true);
    setPending(action);
  };
  const stop = () => {
    setPending(null);
    onBusyChange?.(false);
  };

  const onConnect = async () => {
    try {
      start('google');
      const redirectData = await authService.linkIdentity('google');
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

  const onDisconnect = async () => {
    if (!googleIdentity) return;

    try {
      start('google');
      await authService.unlinkIdentity(googleIdentity.identityId);
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

  const onConnectYoutube = async () => {
    try {
      start('youtube');
      const { url } = await youtubeService.getConnectUrl();
      setTimeout(() => {
        window.open(url, '_self');
      }, 500);
    } catch (e: any) {
      toast.error(t('youtube.connectFailed'), {
        description: await describeApiError(e),
      });
      stop();
    }
  };

  const onDisconnectYoutube = async () => {
    try {
      start('youtube');
      await youtubeService.disconnect();
      toast.success(t('youtube.disconnected'));
      await queryClient.invalidateQueries({ queryKey: ['youtube'] });
    } catch (e: any) {
      toast.error(t('youtube.disconnectFailed'), {
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
          <GoogleIcon className="size-5" />
          <div>
            <p className="font-medium">Google</p>
            {googleIdentity?.email && (
              <p className="text-sm text-muted-foreground">{googleIdentity.email}</p>
            )}
          </div>
        </div>
        {googleIdentity ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                {t('connectedAccounts.disconnect')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('connectedAccounts.confirmDisconnect.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('connectedAccounts.confirmDisconnect.description')}
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
        ) : (
          <Button variant="outline" size="sm" disabled={isLoading} onClick={onConnect}>
            {pending === 'google' && (
              <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
            )}
            {t('connectedAccounts.connect')}
          </Button>
        )}
      </div>

      {showYoutube && (
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <YouTubeIcon className="size-5" />
            <div>
              <p className="font-medium">YouTube</p>
              {youtubeAccount && (
                <p className="text-sm text-muted-foreground">{youtubeAccount}</p>
              )}
            </div>
          </div>
          {youtubeStatus?.connected ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                  {t('connectedAccounts.disconnect')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('youtube.confirmDisconnect.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('youtube.confirmDisconnect.description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('connectedAccounts.confirmDisconnect.cancel')}</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={onDisconnectYoutube}>
                    {t('connectedAccounts.confirmDisconnect.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="outline" size="sm" disabled={isLoading} onClick={onConnectYoutube}>
              {pending === 'youtube' && (
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
