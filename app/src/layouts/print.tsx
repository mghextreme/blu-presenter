import {
  Outlet,
} from "react-router-dom";

export default function PrintLayout() {

  return (
    <div className="bg-white text-slate-900">
      <div className="flex flex-col items-center min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
