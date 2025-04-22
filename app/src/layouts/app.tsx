import {
  Outlet,
  useLoaderData,
} from "react-router-dom";

import { UsersService } from "@/services";
import { UserOrganization } from "@/types";

import ProtectedRoute from "@/components/protected-route";
import AppSidebar from "@/components/app/sidebar";
import AppNavbar from "@/components/app/navbar";
import { Toaster } from "@/components/ui/toaster";

export async function loader({ usersService }: { usersService: UsersService }) {
  return await usersService.getUserOrganizations();
}

export default function AppLayout() {

  const loadedData = useLoaderData() as UserOrganization[];

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
