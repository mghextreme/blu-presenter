import {
  Outlet,
} from "react-router-dom";

import { ServicesProvider } from "@/hooks/services.provider";

export default function ServicesWrapper() {
  return (
    <ServicesProvider>
      <Outlet />
    </ServicesProvider>
  );
}
