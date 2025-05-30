import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
} from "react-router-dom";

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import ThemeToggler from "@/components/ui/theme-toggler";
import { useEffect, useState } from "react";
import LanguageToggler from "@/components/ui/language-toggler";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/sonner";
import { InvitationProvider } from "@/hooks/invitation.provider";
import { IOrganizationInvitation } from "@/types";

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
      <div className="absolute right-4 top-4 md:right-8 md:top-8 flex justify-end">
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
      <Link to="/" className="absolute z-20 text-lg font-medium left-6 top-6 md:left-10 md:top-10 lg:hidden">BluPresenter</Link>
      <div className="relative hidden h-full flex-col p-10 text-foreground lg:flex dark:border-r">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-20 flex items-center">
          <Link to="/" className="text-lg font-medium">BluPresenter</Link>
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
          <Toaster />
        </div>
      </div>
    </div>
  )
}
