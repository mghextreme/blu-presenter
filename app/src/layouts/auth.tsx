import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
} from "react-router-dom";

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import ThemeToggler from "@/components/shared/theme-toggler";
import { useEffect, useState } from "react";
import LanguageToggler from "@/components/shared/language-toggler";
import { Trans, useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/sonner";
import { InvitationProvider } from "@/hooks/invitation.provider";
import { IOrganizationInvitation } from "@/types";
import { BluPresenterLogo } from "@/components/shared/logo";

export default function AuthLayout() {

  const { t } = useTranslation("auth");

  const location = useLocation();
  const inviteData = useLoaderData() as IOrganizationInvitation | null;
  let params = "";

  if (inviteData) {
    params = `?id=${inviteData.id}&secret=${inviteData.secret}`;
  }

  const [isLogin, setIsLogin] = useState<boolean>(false);
  useEffect(() => {
    setIsLogin(location.pathname == '/login');
  }, [location]);

  return (
    <div className="container relative h-screen flex-col items-center justify-stretch grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-card">
      <div className="flex flex-col items-stretch gap-2 lg:hidden">
        <BluPresenterLogo linkTo="/" linkClassName="mx-auto md:absolute z-20 md:left-10 md:top-10 lg:hidden" />
        <div className="md:absolute md:right-8 md:top-8 flex justify-center md:justify-end">
          <Link
            to={{
              pathname: isLogin ? '/signup' : '/login',
              search: params,
            }}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              ""
            )}
          >
            {t((isLogin ? 'signUp' : 'signIn') + '.title')}
          </Link>
          <LanguageToggler variant="ghost"></LanguageToggler>
          <ThemeToggler variant="ghost"></ThemeToggler>
        </div>
      </div>
      <div className="absolute hidden lg:flex right-8 top-8 flex justify-end">
        <Link
          to={{
            pathname: isLogin ? '/signup' : '/login',
            search: params,
          }}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            ""
          )}
        >
          {t((isLogin ? 'signUp' : 'signIn') + '.title')}
        </Link>
        <LanguageToggler variant="ghost"></LanguageToggler>
        <ThemeToggler variant="ghost"></ThemeToggler>
      </div>
      <div className="relative hidden h-full flex-col p-10 text-foreground lg:flex dark:border-r">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-20 flex items-center">
          <BluPresenterLogo linkTo="/" />
        </div>
      </div>
      <div className="lg:p-8 w-full">
        <div className="mx-auto flex w-full flex-col justify-stretch space-y-6 w-full sm:w-[350px]">
          {inviteData?.organization?.name && (
            <>
              <h3 className="text-center text-md">{t('invitation.organization')}<br/><b>{inviteData.organization.name}</b></h3>
            </>
          )}
          <InvitationProvider id={inviteData?.id} secret={inviteData?.secret} email={inviteData?.email} organization={inviteData?.organization?.name}>
            <Outlet />
          </InvitationProvider>
          <div className="mt-4">
            <p className="text-muted-foreground text-sm text-center">
              <Trans t={t} i18nKey="legalNotice">
                By using this service, you agree to our
                <Link to="/terms-and-conditions" target="_blank" className="text-blue-500 hover:underline">Terms and Conditions</Link> and
                <Link to="/privacy-policy" target="_blank" className="text-blue-500 hover:underline">Privacy Policy</Link>.
              </Trans>
            </p>
          </div>
          <Toaster />
        </div>
      </div>
      <div className="lg:hidden"></div>
    </div>
  )
}
