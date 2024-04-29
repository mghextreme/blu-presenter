import {
  Outlet,
} from "react-router-dom";

import ControllerNavbar from "@/components/controller/navbar";
import ControllerProvider from "@/components/controller/controller-provider";

export default function ControllerLayout() {
  return (
    <div className="min-h-screen h-screen bg-card flex flex-col justify-stretch">
      <ControllerProvider>
        <ControllerNavbar></ControllerNavbar>
        <Outlet />
      </ControllerProvider>
    </div>
  );
}
