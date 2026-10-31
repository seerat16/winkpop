import { Outlet, useLocation } from "../router";
import { BottomNav } from "./BottomNav";
import { Toaster } from "sonner";

const NO_NAV_PATHS = ["/", "/login", "/onboarding"];

export function AppShell() {
  const location = useLocation();
  const showNav = !NO_NAV_PATHS.includes(location.pathname);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col" style={{ paddingBottom: showNav ? "65px" : 0 }}>
        <Outlet />
      </div>
      {showNav && <BottomNav />}
      <Toaster position="top-center" />
    </div>
  );
}
