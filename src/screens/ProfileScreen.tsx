import { useNavigate } from "react-router-dom";
import { BadgeCheck, LogOut, Settings, Star } from "lucide-react";
import { Button } from "@/components/ui";
import { GROUP_MAP } from "@/data/groups";
import { useUserStore } from "@/data/userStore";

export default function ProfileScreen() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  if (!user) return null;

  const stats = [
    { label: "Listings", value: 12 },
    { label: "Sales", value: user.completedTransactions },
    { label: "Wishlist", value: user.wishlistIds.length },
  ];

  return (
    <div className="px-4 pt-2">
      <div className="mt-2 flex flex-col items-center rounded-card border border-wink-pink-border bg-white p-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-wink-purple-soft">
          <span className="font-display text-2xl font-extrabold text-white">
            {user.displayName.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="font-display text-lg font-bold text-wink-ink">{user.displayName}</span>
          {user.verifiedSeller && <BadgeCheck size={16} color="#5CC0A8" />}
        </div>
        <span className="text-sm text-wink-muted">@{user.username}</span>
        {user.rating > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <Star size={13} color="#F4A07C" fill="#F4A07C" />
            <span className="text-xs text-wink-muted">
              {user.rating.toFixed(1)} · {user.completedTransactions} transactions
            </span>
          </div>
        )}
        {user.bio && <p className="mt-2 text-center text-sm text-wink-ink">{user.bio}</p>}

        <div className="mt-4 flex w-full justify-around border-t border-wink-pink-border pt-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className="font-display text-lg font-bold text-wink-ink">{s.value}</span>
              <span className="text-xs text-wink-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mb-2 mt-5 font-display font-bold text-wink-ink">Currently collecting</p>
      {user.collectingGroupIds.length === 0 ? (
        <p className="text-sm text-wink-muted">You haven&apos;t picked any groups yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {user.collectingGroupIds.map((id) => {
            const g = GROUP_MAP[id];
            if (!g) return null;
            return (
              <span
                key={id}
                className="rounded-pill px-3 py-1.5 text-xs text-white"
                style={{ background: g.color }}
              >
                {g.name}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <Button
          variant="secondary"
          fullWidth
          icon={<Settings size={16} color="#2D2D2D" />}
          onClick={() => navigate("/settings")}
        >
          Settings
        </Button>
        <Button
          variant="ghost"
          fullWidth
          icon={<LogOut size={16} color="#D4759A" />}
          onClick={logout}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}
