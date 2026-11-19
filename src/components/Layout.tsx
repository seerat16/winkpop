import { NavLink, Outlet } from "react-router-dom";
import { ArrowLeftRight, Compass, Heart, Search, User } from "lucide-react";

const TABS = [
  { to: "/home", label: "Discover", Icon: Compass },
  { to: "/browse", label: "Browse", Icon: Search },
  { to: "/wishlist", label: "Wishlist", Icon: Heart },
  { to: "/transactions", label: "Transactions", Icon: ArrowLeftRight },
  { to: "/profile", label: "Profile", Icon: User },
];

/**
 * App shell: a phone-width centered column with a fixed bottom tab bar.
 * On iOS (Capacitor WebView) the safe-area padding keeps the bar above the
 * home indicator.
 */
export default function Layout() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-wink-purple-tint">
      <main className="flex-1 pb-[76px]" style={{ paddingTop: "var(--sat)" }}>
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md border-t border-wink-pink-border bg-white"
        style={{ paddingBottom: "var(--sab)" }}
      >
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className="flex flex-1 flex-col items-center gap-0.5 py-2">
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  color={isActive ? "#D4759A" : "#9A9A9A"}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className={`text-[10px] ${isActive ? "font-bold text-wink-pink" : "text-wink-muted"}`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
