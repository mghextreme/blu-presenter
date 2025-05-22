import {
  Outlet,
  useLoaderData,
  useRevalidator,
} from "react-router-dom";

import { OrganizationsService } from "@/services";
import { UserOrganization } from "@/types";

import ProtectedRoute from "@/components/protected-route";
import AppSidebar from "@/components/app/sidebar";
import AppNavbar from "@/components/app/navbar";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export async function loader({ organizationsService }: { organizationsService: OrganizationsService }) {
  return await organizationsService.getFromUser();
}

export default function AppLayout() {

  const loadedData = useLoaderData() as UserOrganization[];
  const { revalidate } = useRevalidator();
  const { organization, organizations, setOrganizationById } = useAuth();

  useEffect(() => {
    revalidate();
    setOrganizationById(null);
  }, [loadedData, organization, organizations]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar></AppSidebar>
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <AppNavbar></AppNavbar>
          <Outlet />
          <Toaster />
        </div>
      </div>
    </ProtectedRoute>
  );
}
