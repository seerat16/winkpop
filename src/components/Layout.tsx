import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ArrowLeftRight, Compass, Image as ImageIcon, MessageCircle, Plus, Tag, User } from "lucide-react";
import { useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { MenuItem, Sheet } from "./primitives";

const TABS = [
  { to: "/home", label: "Discover", Icon: Compass },
  { to: "/transactions", label: "Transactions", Icon: ArrowLeftRight },
  { to: "/messages", label: "Messages", Icon: MessageCircle },
  { to: "/profile", label: "Profile", Icon: User },
];

/**
 * App shell (§2A): a phone-width column with a fixed bottom tab bar —
 * Discover · Transactions · + · Messages · Profile. The centre "+" opens the
 * "What would you like to upload?" sheet (§5). On iOS/Android (Capacitor
 * WebView) the safe-area padding keeps the bar above the home indicator.
 */
export default function Layout() {
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const me = useUserStore((s) => s.user?.username);
  const unread = useAppStore(
    (s) =>
      s.conversations.filter(
        (c) => !c.isRequest && (c.markedUnread || c.messages.some((m) => me && !m.readBy.includes(me))),
      ).length,
  );

  const tab = ({ to, label, Icon }: (typeof TABS)[number]) => (
    <NavLink key={to} to={to} className="flex flex-1 flex-col items-center gap-0.5 py-2">
      {({ isActive }: { isActive: boolean }) => (
        <>
          <span className="relative">
            <Icon size={20} color={isActive ? "#D4759A" : "#9A9A9A"} strokeWidth={isActive ? 2.5 : 1.8} />
            {to === "/messages" && unread > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-wink-pink px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </span>
          <span className={`text-[10px] ${isActive ? "font-bold text-wink-pink" : "text-wink-muted"}`}>{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-wink-purple-tint">
      <main className="min-h-0 flex-1 overflow-hidden" style={{ paddingBottom: "calc(62px + var(--sab))" }}>
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md items-center border-t border-wink-pink-border bg-white"
        style={{ paddingBottom: "var(--sab)" }}
      >
        {TABS.slice(0, 2).map(tab)}
        <button
          type="button"
          aria-label="Upload"
          onClick={() => setUploadOpen(true)}
          className="flex flex-1 items-center justify-center"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-wink-pink">
            <Plus size={24} color="#fff" />
          </span>
        </button>
        {TABS.slice(2).map(tab)}
      </nav>

      <Sheet visible={uploadOpen} onClose={() => setUploadOpen(false)} title="What would you like to upload?">
        <MenuItem
          icon={<ImageIcon size={20} color="#7C3AED" />}
          label="Upload Post"
          sub="Share an ISO, DWAYOR, collection drop, art & more"
          onPress={() => {
            setUploadOpen(false);
            navigate("/post/new");
          }}
        />
        <MenuItem
          icon={<Tag size={20} color="#D4759A" />}
          label="Upload Listing"
          sub="List a photocard for sale or trade"
          onPress={() => {
            setUploadOpen(false);
            navigate("/listing/new");
          }}
        />
      </Sheet>
    </div>
  );
}
