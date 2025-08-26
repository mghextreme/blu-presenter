import { Button } from "@/components/ui/button";

import GoogleIcon from "@/components/logos/google";
import { useServices } from "@/hooks/services.provider";
import { ApiError } from "@/types";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useInvitation } from "@/hooks/invitation.provider";
import { IAuthInvitationData } from "@/types/auth";
// import MicrosoftIcon from "@/components/logos/microsoft";
// import AppleIcon from "@/components/logos/apple";
// import FacebookIcon from "@/components/logos/facebook";
// import GithubIcon from "@/components/logos/github";

type SocialLoginProps = {
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

export function SocialLogin({ isLoading, setIsLoading }: SocialLoginProps) {

  const { t } = useTranslation("auth");
  const { authService } = useServices();
  const { id: inviteId, secret: inviteSecret } = useInvitation();

  const oauthOpen = async (provider: string) => {
    try {
      setIsLoading(true);

      let invite: IAuthInvitationData | undefined = undefined;
      if (inviteId && inviteSecret) {
        invite = {
          id: inviteId,
          secret: inviteSecret,
        } as IAuthInvitationData;
        localStorage.setItem('invite', JSON.stringify(invite));
      }

      const redirectData = await authService.signInWithProvider(provider, invite);
      localStorage.setItem('auth-token-code-verifier', redirectData.codeVerifier);

      // Timeout ensures localStorage is saved
      setTimeout(async () => {
        window.open(redirectData.url, '_self');
      }, 500);
    }
    catch (e: unknown) {
      const error = e as ApiError;
      if (error) {
        const errorContent = await error.raw?.json();
        if (errorContent) {
          toast.error(t('signIn.error'), {
            description: t('errors.' + errorContent?.message || 'default'),
          });
        }
      }

      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-col-1 space-y-2">
      <Button variant="outline" type="button" disabled={isLoading} onClick={() => oauthOpen('google')}>
        <GoogleIcon className="size-4 me-2"></GoogleIcon>
        {" "}Google
      </Button>
      {/* <Button variant="outline" type="button" disabled={isLoading}>
        <MicrosoftIcon className="size-4 me-2"></MicrosoftIcon>
        {" "}Microsoft
      </Button>
      <Button variant="outline" type="button" disabled={isLoading}>
        <AppleIcon className="size-4 me-2"></AppleIcon>
        {" "}Apple
      </Button>
      <Button variant="outline" type="button" disabled={isLoading}>
        <FacebookIcon className="size-4 me-2"></FacebookIcon>
        {" "}Facebook
      </Button>
      <Button variant="outline" type="button" disabled={isLoading}>
        <GithubIcon className="size-4 me-2"></GithubIcon>
        {" "}GitHub
      </Button> */}
    </div>
  )
}
