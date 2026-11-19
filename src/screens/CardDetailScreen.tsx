import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Heart, ShoppingCart, TrendingUp } from "lucide-react";
import { PhotocardImage } from "@/components/PhotocardImage";
import { Button } from "@/components/ui";
import { getPhotocard } from "@/data/photocards";
import { getPriceHistory, getPriceStats } from "@/data/priceHistory";
import { useUserStore } from "@/data/userStore";

export default function CardDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const card = getPhotocard(id ?? "");

  const user = useUserStore((s) => s.user);
  const toggleLike = useUserStore((s) => s.toggleLike);
  const toggleCart = useUserStore((s) => s.toggleCart);
  const toggleWishlist = useUserStore((s) => s.toggleWishlist);

  if (!card) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-wink-muted">
        Card not found
      </div>
    );
  }

  const liked = user?.likesIds.includes(card.id) ?? false;
  const inCart = user?.cartIds.includes(card.id) ?? false;
  const wishlisted = user?.wishlistIds.includes(card.id) ?? false;

  const stats = getPriceStats(card.id);
  const history = getPriceHistory(card.id);
  const maxPrice = Math.max(...history.map((h) => h.price), 1);

  return (
    <div className="pb-28">
      <div className="flex items-center justify-between px-4 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <ChevronLeft size={20} color="#2D2D2D" />
        </button>
        <button
          type="button"
          onClick={() => toggleLike(card.id)}
          aria-label="Like"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <Heart
            size={18}
            color={liked ? "#D4759A" : "#9A9A9A"}
            fill={liked ? "#D4759A" : "none"}
          />
        </button>
      </div>

      <div className="flex justify-center px-6 pt-2">
        <div className="w-2/3">
          <PhotocardImage
            groupId={card.groupId}
            memberName={card.memberName}
            imgSeed={card.imgSeed}
            className="w-full rounded-card"
          />
        </div>
      </div>

      <div className="px-5 pt-5">
        <p className="font-display font-bold text-wink-pink">{card.groupName}</p>
        <h1 className="font-display text-xl font-extrabold text-wink-ink">
          {card.memberName} · {card.era}
        </h1>
        <p className="mt-1 text-sm text-wink-muted">
          {card.type} · {card.condition} · @{card.sellerUsername}
        </p>

        <div className="mt-4 flex items-end gap-2">
          <span className="font-display text-3xl font-extrabold text-wink-ink">
            ${card.price.toFixed(2)}
          </span>
          {card.intent !== "sale" && (
            <span className="mb-1 rounded-pill bg-wink-purple-tint px-2 py-0.5 text-xs text-wink-purple">
              {card.intent === "trade" ? "Trade only" : "Sale or trade"}
            </span>
          )}
        </div>

        {stats && (
          <div className="mt-5 rounded-card border border-wink-pink-border bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp size={16} color="#5CC0A8" />
              <span className="font-display font-bold text-wink-ink">Price intelligence</span>
            </div>
            <div className="mb-3 flex justify-between">
              <Stat label="Low" value={stats.low} />
              <Stat label="Avg" value={stats.avg} highlight />
              <Stat label="High" value={stats.high} />
              <Stat label="Last" value={stats.last} />
            </div>
            <div className="flex h-16 items-end gap-0.5">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-wink-purple-soft"
                  style={{ height: `${(h.price / maxPrice) * 100}%` }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-wink-muted">
              Recent sales suggest ${stats.low.toFixed(0)}–${stats.high.toFixed(0)} for this card.
            </p>
          </div>
        )}
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md gap-3 border-t border-wink-pink-border bg-white px-5 pt-4"
        style={{ paddingBottom: "calc(var(--sab) + 16px)" }}
      >
        <Button variant="secondary" fullWidth onClick={() => toggleWishlist(card.id)}>
          {wishlisted ? "On wishlist" : "Add to wishlist"}
        </Button>
        <Button
          variant={inCart ? "mint" : "primary"}
          fullWidth
          icon={<ShoppingCart size={16} color="#fff" />}
          onClick={() => toggleCart(card.id)}
        >
          {inCart ? "In cart" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`font-display font-bold ${highlight ? "text-wink-pink" : "text-wink-ink"}`}>
        ${value.toFixed(0)}
      </span>
      <span className="text-xs text-wink-muted">{label}</span>
    </div>
  );
}
