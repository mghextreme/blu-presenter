import {
  Outlet,
} from "react-router-dom";

import ProtectedRoute from "@/components/protected-route";
import ControllerNavbar from "@/components/controller/navbar";
import ControllerProvider from "@/hooks/controller.provider";

export default function ControllerLayout() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen h-screen bg-card flex flex-col justify-stretch">
        <ControllerProvider>
          <ControllerNavbar></ControllerNavbar>
          <Outlet />
        </ControllerProvider>
      </div>
    </ProtectedRoute>
  );
}
