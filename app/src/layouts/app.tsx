import {
  Outlet,
} from "react-router-dom";

import { ProtectedRoute } from "@/components/protected-route";
import { AppSidebar } from "@/components/app/sidebar";
import { AppNavbar } from "@/components/app/navbar";
import { OfflineSyncManager } from "@/components/shared/offline-sync-manager";
import { Toaster } from "@/components/ui/sonner";
import { useServices } from "@/hooks/useServices";
import { useEffect } from "react";

export function AppLayout() {
  const { authService } = useServices();

  useEffect(() => {
    // Failure (e.g. offline) is fine: organizations come from the persisted
    // auth store and are re-synced whenever the app is online.
    authService.refreshOrganizations().catch(() => { /* keep cached orgs */ });
  }, []);

  return (
    <ProtectedRoute>
      <OfflineSyncManager />
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
