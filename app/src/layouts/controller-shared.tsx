import {
  Outlet,
} from "react-router-dom";

import { ControllerProvider } from "@/hooks/controller.provider";

export function ControllerSharedLayout() {
  return (
    <div className="min-h-screen h-screen flex flex-col justify-stretch">
      <ControllerProvider>
        <Outlet />
      </ControllerProvider>
    </div>
  );
}
