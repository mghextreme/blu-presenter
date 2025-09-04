import {
  Link,
  Outlet,
} from "react-router-dom";

import AppNavbar from "@/components/app/navbar";
import { Toaster } from "@/components/ui/sonner";
import { useServices } from "@/hooks/services.provider";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function AppPublicLayout() {
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
            <Link to="/app">
              <Button>{t('button.openDashboard')}</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">{t('button.login')}</Button>
              </Link>
              <Link to="/signup">
                <Button>{t('button.signUp')}</Button>
              </Link>
            </>
          )}
        </AppNavbar>
        <Outlet />
        <Toaster />
      </div>
    </div>
  );
}
