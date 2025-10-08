import { Outlet } from "react-router-dom";
import { SharedFooter } from "@/components/shared/footer";
import { SharedNavbar } from "@/components/shared/navbar";

export default function PublicPagesLayout() {
  return (
    <div className="min-h-screen">
      <SharedNavbar />
      <Outlet />
      <SharedFooter />
    </div>
  );
}
