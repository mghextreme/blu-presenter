import { useTranslation } from "react-i18next";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import { useServices } from "@/hooks/useServices";
import { useEffect } from "react";
import { IExchangeCodeData } from "@/types/auth";
import { useNavigate, useSearchParams } from "react-router-dom";

export function OAuthLinkCallback() {

  const { t } = useTranslation("profile");
  const navigate = useNavigate();

  const [params] = useSearchParams();
  const code = params.get('code');
  const codeVerifier = localStorage.getItem('link-identity-code-verifier');

  if (!code || !codeVerifier) {
    throw new Error(t('connectedAccounts.linkError'));
  }

  const { authService } = useServices();

  const completeLink = async () => {
    const payload = {
      code,
      codeVerifier,
    } as IExchangeCodeData;

    await authService.exchangeCodeForSession(payload);
    localStorage.removeItem('link-identity-code-verifier');

    // Timeout prevents users from briefly seeing the React Router error layout
    setTimeout(async () => {
      await navigate('/app/profile', { replace: true });
    }, 100);
  }

  useEffect(() => {
    completeLink();
  });

  return (
    <>
      <div className="flex flex-col space-y-6 text-center items-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('connectedAccounts.linking')}
        </h1>
        <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
      </div>
    </>
  );
}
