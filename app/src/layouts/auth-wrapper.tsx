import {
  Outlet,
} from "react-router-dom";

import { AuthProvider } from "@/hooks/auth.provider";

export default function AuthWrapper() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
