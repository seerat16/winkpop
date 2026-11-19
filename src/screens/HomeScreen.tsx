import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Search, ShoppingCart } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PhotocardTile } from "@/components/PhotocardTile";
import { Chip } from "@/components/ui";
import { PHOTOCARDS } from "@/data/photocards";
import { searchPhotocards } from "@/data/search";
import { useUserStore } from "@/data/userStore";

type Feed = "suggested" | "new";

export default function HomeScreen() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [feed, setFeed] = useState<Feed>("suggested");

  const cards = useMemo(() => {
    if (feed === "new") return searchPhotocards(PHOTOCARDS, { sort: "new" }).slice(0, 16);
    const collecting = new Set(user?.collectingGroupIds ?? []);
    const ranked = searchPhotocards(PHOTOCARDS, { sort: "popular" });
    const mine = ranked.filter((c) => collecting.has(c.groupId));
    const rest = ranked.filter((c) => !collecting.has(c.groupId));
    return [...mine, ...rest].slice(0, 16);
  }, [feed, user?.collectingGroupIds]);

  const cartCount = user?.cartIds.length ?? 0;

  return (
    <div className="px-4 pt-2">
      <div className="mb-3 flex items-center justify-between">
        <Logo size={40} showWordmark={false} />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="relative"
            aria-label="Cart"
          >
            <ShoppingCart size={21} color="#9A9A9A" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-wink-pink text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
          <button type="button" onClick={() => navigate("/wishlist")} aria-label="Wishlist">
            <Heart size={21} color="#9A9A9A" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate("/browse")}
        className="mb-3 flex w-full items-center gap-3 rounded-card border border-wink-pink-border bg-white px-4 py-3"
      >
        <Search size={15} color="#9A9A9A" />
        <span className="text-sm text-wink-muted">Search your favorite photocards…</span>
      </button>

      <div className="mb-4 flex gap-2">
        <Chip
          label="Suggested"
          active={feed === "suggested"}
          onClick={() => setFeed("suggested")}
        />
        <Chip label="New Drops" active={feed === "new"} onClick={() => setFeed("new")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <PhotocardTile key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
