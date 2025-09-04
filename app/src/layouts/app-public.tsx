import {
  Outlet,
} from "react-router-dom";

import AppNavbar from "@/components/app/navbar";
import { Toaster } from "@/components/ui/sonner";
import { useServices } from "@/hooks/services.provider";
import { useEffect } from "react";

export default function AppPublicLayout() {
  const { authService } = useServices();

  useEffect(() => {
    authService.refreshOrganizations();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <AppNavbar></AppNavbar>
        <Outlet />
        <Toaster />
      </div>
    </div>
  );
}
