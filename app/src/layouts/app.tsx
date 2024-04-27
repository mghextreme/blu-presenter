import {
  Outlet,
} from "react-router-dom";

export default function AppLayout() {
  return (
    <>
      <div>
        <h1 className="text-2xl">Main layout</h1>
        <Outlet />
      </div>
    </>
  );
}
