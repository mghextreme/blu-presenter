import { useTranslation } from "react-i18next";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { useServices } from "@/hooks/services.provider";
import { useEffect } from "react";
import { IAuthInvitationData, IExchangeCodeData } from "@/types/auth";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuthCallback() {

  const { t } = useTranslation("auth");
  const navigate = useNavigate();

  const [params] = useSearchParams();
  const code = params.get('code');
  const codeVerifier = localStorage.getItem('auth-token-code-verifier');

  if (!code || !codeVerifier) {
    throw new Error(t('errors.oauth'));
  }

  const { authService } = useServices();

  const rawInvite = localStorage.getItem('invite');
  let invite: IAuthInvitationData | undefined = undefined;
  if (rawInvite) {
    try {
      invite = JSON.parse(rawInvite) as IAuthInvitationData;
    }
    catch (e) {
      console.log(e);
    }
  }

  const validateTokens = async () => {
    const payload = {
      code,
      codeVerifier,
    } as IExchangeCodeData;

    if (invite) {
      payload.invite = invite;
    }

    await authService.exchangeCodeForSession(payload);
    localStorage.removeItem('auth-token-code-verifier');
    localStorage.removeItem('invite');

    await navigate('/app', { replace: true });
  }

  useEffect(() => {
    validateTokens();
  });

  return (
    <>
      <div className="flex flex-col space-y-6 text-center items-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('signIn.signingIn')}
        </h1>
        <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
      </div>
    </>
  );
}
