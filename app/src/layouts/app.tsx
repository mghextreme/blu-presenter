import {
  Outlet,
} from "react-router-dom";

import ProtectedRoute from "@/components/protected-route";
import AppSidebar from "@/components/app/sidebar";
import AppNavbar from "@/components/app/navbar";
import { Toaster } from "@/components/ui/sonner";
import { useServices } from "@/hooks/useServices";
import { useEffect } from "react";

export default function AppLayout() {
  const { authService } = useServices();

  useEffect(() => {
    authService.refreshOrganizations();
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen overflow-hidden items-stretch justify-stretch">
        <AppNavbar />
        <div className="h-full relative flex flex-1 flex">
          <AppSidebar></AppSidebar>
          <div className="flex-1 overflow-y-auto overflow-x-hidden pb-12 sm:pb-0">
            <Outlet />
          </div>
        </div>
        <Toaster />
      </div>
    </ProtectedRoute>
  );
}
