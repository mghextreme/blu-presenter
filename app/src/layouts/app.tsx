import {
  Outlet,
  useLoaderData,
} from "react-router-dom";

import { UsersService } from "@/services";
import { IOrganization } from "@/types/organization.interface";

import ProtectedRoute from "@/components/protected-route";
import AppSidebar from "@/components/app/sidebar";
import AppNavbar from "@/components/app/navbar";
import { Toaster } from "@/components/ui/toaster";

export async function loader({ usersService }: { usersService: UsersService }) {
  return await usersService.getOrganizations();
}

export default function AppLayout() {

  const loadedData = useLoaderData() as IOrganization[];

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar></AppSidebar>
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <AppNavbar organizations={loadedData}></AppNavbar>
          <Outlet />
          <Toaster />
        </div>
      </div>
    </ProtectedRoute>
  );
}
