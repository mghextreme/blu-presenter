import {
  Outlet,
} from "react-router-dom";

import ProtectedRoute from "@/components/protected-route";
import AppSidebar from "@/components/app/sidebar";
import AppNavbar from "@/components/app/navbar";
import { Toaster } from "@/components/ui/sonner";
import { useServices } from "@/hooks/services.provider";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function AppLayout() {
  const { authService } = useServices();

  const { t } = useTranslation('app');

  useEffect(() => {
    authService.refreshOrganizations();
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar></AppSidebar>
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <AppNavbar>{t('welcome.message')}</AppNavbar>
          <Outlet />
          <Toaster />
        </div>
      </div>
    </ProtectedRoute>
  );
}
