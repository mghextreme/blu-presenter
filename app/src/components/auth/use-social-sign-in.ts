import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useServices } from '@/hooks/useServices';
import { useInvitation } from '@/hooks/useInvitation';
import { ApiError } from '@/types';
import { IAuthInvitationData } from '@/types/auth';
import { STORAGE_KEYS } from '@/lib/storage-keys';

/** Starts an OAuth sign-in; on success the page redirects to the provider. */
export function useSocialSignIn() {
  const { t } = useTranslation('auth');
  const { authService } = useServices();
  const { id: inviteId, secret: inviteSecret } = useInvitation();

  return useMutation({
    mutationFn: (provider: string) => {
      let invite: IAuthInvitationData | undefined = undefined;
      if (inviteId && inviteSecret) {
        invite = {
          id: inviteId,
          secret: inviteSecret,
        } as IAuthInvitationData;
        localStorage.setItem(STORAGE_KEYS.authInvite, JSON.stringify(invite));
      }

      return authService.signInWithProvider(provider, invite);
    },
    onSuccess: (redirectData) => {
      localStorage.setItem('auth-token-code-verifier', redirectData.codeVerifier);

      // Timeout ensures localStorage is saved
      setTimeout(() => {
        window.open(redirectData.url, '_self');
      }, 500);
    },
    onError: async (e: unknown) => {
      const error = e as ApiError;
      if (error) {
        const errorContent = await error.raw?.json();
        if (errorContent) {
          toast.error(t('signIn.error'), {
            description: t('errors.' + errorContent?.message || 'default'),
          });
        }
      }
    },
  });
}
