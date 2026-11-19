import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useServices } from "@/hooks/useServices";
import { describeApiError } from "@/types";
import { GoogleIcon } from "@/components/logos/google";
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
  const { authService } = useServices();

  const [isLoading, setLoading] = useState<boolean>(false);

  const googleIdentity = identities.identities.find(i => i.provider === 'google');

  const setBusy = (busy: boolean) => onBusyChange?.(busy);

  const onConnect = async () => {
    try {
      setBusy(true);
      setLoading(true);
      const redirectData = await authService.linkIdentity('google');
      localStorage.setItem('link-identity-code-verifier', redirectData.codeVerifier);

      setTimeout(() => {
        window.open(redirectData.url, '_self');
      }, 500);
    } catch (e: any) {
      toast.error(t('connectedAccounts.connectFailed'), {
        description: await describeApiError(e),
      });
      setLoading(false);
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    if (!googleIdentity) return;

    try {
      setBusy(true);
      setLoading(true);

      await authService.unlinkIdentity(googleIdentity.identityId);
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
          {isLoading && (
            <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
          )}
          {t('connectedAccounts.connect')}
        </Button>
      )}
    </div>
  );
}
