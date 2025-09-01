import {
  Outlet,
} from "react-router-dom";

import ProtectedRoute from "@/components/protected-route";

export default function PrintLayout() {

  return (
    <ProtectedRoute>
      <div className="bg-white text-slate-900">
        <div className="flex flex-col items-center min-h-screen">
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  );
}
