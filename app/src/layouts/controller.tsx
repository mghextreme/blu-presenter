import {
  Outlet,
} from "react-router-dom";

import ProtectedRoute from "@/components/protected-route";
import ControllerNavbar from "@/components/controller/navbar";
import ControllerProvider from "@/hooks/controller.provider";
import BroadcastProvider from "@/hooks/broadcast.provider";
import { Toaster } from "@/components/ui/sonner";

export default function ControllerLayout() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen h-screen bg-card flex flex-col justify-stretch">
        <ControllerProvider>
          <BroadcastProvider>
            <ControllerNavbar></ControllerNavbar>
            <Outlet />
            <Toaster />
          </BroadcastProvider>
        </ControllerProvider>
      </div>
    </ProtectedRoute>
  );
}
