import {
  Outlet,
} from "react-router-dom";

import ControllerNavbar from "@/components/controller/navbar";

export default function ControllerLayout() {
  return (
    <div className="min-h-screen bg-card flex flex-col justify-stretch">
      <ControllerNavbar></ControllerNavbar>
      <Outlet />
    </div>
  );
}
