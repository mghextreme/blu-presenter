import {
  Link,
  Outlet,
} from "react-router-dom";

import AppNavbar from "@/components/app/navbar";
import { Toaster } from "@/components/ui/sonner";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function AppSharedLayout() {
  const { authService } = useServices();

  const { t } = useTranslation('home');
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    authService.refreshOrganizations();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <AppNavbar>
          {isLoggedIn ? (
            <Button asChild>
              <Link to="/app">{t('button.openDashboard')}</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/login">{t('button.login')}</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">{t('button.signUp')}</Link>
              </Button>
            </>
          )}
        </AppNavbar>
        <Outlet />
        <Toaster />
      </div>
    </div>
  );
}
