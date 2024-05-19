import {
  Outlet,
} from "react-router-dom";

import { AuthProvider } from "@/hooks/auth.provider";

export default function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
