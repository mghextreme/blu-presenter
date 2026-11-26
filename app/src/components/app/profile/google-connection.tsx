import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useServices } from '@/hooks/useServices';
import { describeApiError } from '@/types';
import { GoogleIcon } from '@/components/logos/google';
import { YouTubeIcon } from '@/components/logos/youtube';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import ArrowPathIcon from '@heroicons/react/24/solid/ArrowPathIcon';
import { IUserIdentitiesResponse } from '@/types/auth';

interface GoogleConnectionProps {
  identities: IUserIdentitiesResponse;
}

export function GoogleConnection({ identities }: Readonly<GoogleConnectionProps>) {
  const { t } = useTranslation('profile');
  const { authService, youtubeService } = useServices();

  const googleIdentity = identities.identities.find((i) => i.provider === 'google');

  const { data: youtubeStatus } = useQuery({ ...youtubeService.getStatusQuery(), retry: false });

  // Shown whenever the server has YouTube configured; also kept for users who
  // already connected so they can still disconnect.
  const showYoutube = !!youtubeStatus?.playlistsEnabled || !!youtubeStatus?.connected;
  const youtubeAccount = youtubeStatus?.connected
    ? youtubeStatus.accountName || youtubeStatus.accountId
    : null;

  const connectGoogle = useMutation({
    mutationFn: () => authService.linkIdentity('google'),
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

  const disconnectGoogle = useMutation({
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

  const connectYoutube = useMutation({
    mutationFn: () => youtubeService.getConnectUrl(),
    onSuccess: ({ url }) => {
      setTimeout(() => {
        window.open(url, '_self');
      }, 500);
    },
    onError: async (e) => {
      toast.error(t('youtube.connectFailed'), {
        description: await describeApiError(e),
      });
    },
  });

  const disconnectYoutube = useMutation({
    mutationFn: () => youtubeService.disconnect(),
    onSuccess: () => {
      toast.success(t('youtube.disconnected'));
    },
    onError: async (e) => {
      toast.error(t('youtube.disconnectFailed'), {
        description: await describeApiError(e),
      });
    },
  });

  // A successful connect stays busy: the page is about to redirect to the provider.
  const isGoogleBusy =
    connectGoogle.isPending || connectGoogle.isSuccess || disconnectGoogle.isPending;
  const isYoutubeBusy =
    connectYoutube.isPending || connectYoutube.isSuccess || disconnectYoutube.isPending;
  const isLoading = isGoogleBusy || isYoutubeBusy;

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
                <AlertDialogTitle>
                  {t('connectedAccounts.confirmDisconnect.title')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('connectedAccounts.confirmDisconnect.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t('connectedAccounts.confirmDisconnect.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => disconnectGoogle.mutate(googleIdentity.identityId)}
                >
                  {t('connectedAccounts.confirmDisconnect.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => connectGoogle.mutate()}
          >
            {isGoogleBusy && <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>}
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
              {youtubeAccount && <p className="text-sm text-muted-foreground">{youtubeAccount}</p>}
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
                  <AlertDialogCancel>
                    {t('connectedAccounts.confirmDisconnect.cancel')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => disconnectYoutube.mutate()}
                  >
                    {t('connectedAccounts.confirmDisconnect.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => connectYoutube.mutate()}
            >
              {isYoutubeBusy && (
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
