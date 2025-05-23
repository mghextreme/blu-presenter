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
import { Toaster } from "@/components/ui/toaster";
import { OrganizationsService } from "@/services";
import { InvitationProvider } from "@/hooks/invitation.provider";
import { IOrganization } from "@/types";

export async function loader({ request, organizationsService }: { request: Request, organizationsService: OrganizationsService }) {
  const params = new URL(request.url).searchParams;
  const id = params.get('id');
  const secret = params.get('secret');

  if (!id || !secret) {
    return null;
  }

  return await organizationsService.getInvite(Number(id), secret);
}

export default function AuthLayout() {

  const { t } = useTranslation("auth");

  const location = useLocation();
  const inviteData = useLoaderData() as { id: number, secret: string, organization: IOrganization } | null;
  let params = "";

  if (inviteData) {
    params = `?id=${inviteData.id}&secret=${inviteData.secret}`;
  }

  const [isLogin, setIsLogin] = useState<boolean>(false);
  useEffect(() => {
    setIsLogin(location.pathname == '/login');
  }, [location])

  return (
    <div className="container relative hidden h-screen overflow-hidden flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-card">
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
      <div className="relative hidden h-full flex-col p-10 text-foreground lg:flex dark:border-r">
        <div className="absolute inset-0 bg-background" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link to="/" className="text-lg font-medium">Blu Presenter</Link>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          {inviteData?.organization?.name && (
            <>
              <h3 className="text-center text-md">{t('invitation.organization')}<br/><b>{inviteData.organization.name}</b></h3>
            </>
          )}
          <InvitationProvider email={inviteData?.email} organization={inviteData?.organization?.name}>
            <Outlet />
          </InvitationProvider>
          <Toaster />
        </div>
      </div>
    </div>
  )
}
