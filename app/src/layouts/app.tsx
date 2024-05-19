import {
  Outlet,
} from "react-router-dom";

import ProtectedRoute from "@/components/protected-route";
import AppSidebar from "@/components/app/sidebar";
import AppNavbar from "@/components/app/navbar";

export default function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar></AppSidebar>
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <AppNavbar></AppNavbar>
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
}
