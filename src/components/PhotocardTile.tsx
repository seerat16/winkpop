import { useNavigate } from "react-router-dom";
import { Heart, Layers, ShoppingCart } from "lucide-react";
import type { Photocard, UserListing } from "@/data/types";
import { useUserStore } from "@/data/userStore";
import { PhotocardImage } from "./PhotocardImage";
import { intentLabel } from "@/lib/format";

/** WTS / WTT / WTT/WTS label for a listing's intent (§7O). */

/** A single photocard card in a grid — reused across Discover, Browse, profiles. */
export function PhotocardTile({ card, compact = false }: { card: Photocard; compact?: boolean }) {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const toggleLike = useUserStore((s) => s.toggleLike);
  const toggleCart = useUserStore((s) => s.toggleCart);

  const liked = user?.likesIds.includes(card.id) ?? false;
  const inCart = user?.cartIds.includes(card.id) ?? false;
  const extra = card as Partial<UserListing>;
  const slides = extra.slides?.length ?? 0;

  return (
    <button
      type="button"
      onClick={() => navigate(`/card/${card.id}`)}
      className="w-full overflow-hidden rounded-card border border-wink-pink-border bg-white text-left transition active:scale-[0.98]"
      style={{ opacity: card.available ? 1 : 0.6 }}
    >
      <div className="relative">
        <PhotocardImage
          groupId={card.groupId}
          memberName={card.memberName}
          imgSeed={card.imgSeed}
          rounded={false}
        />

        {!card.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded bg-black/50 px-2 py-0.5 text-xs font-bold text-white">
              SOLD OUT
            </span>
          </div>
        )}
        {card.damaged && (
          <span className="absolute left-2 top-2 rounded bg-wink-warn px-1.5 py-0.5 text-[8px] font-bold text-white">
            ⚠ DMG
          </span>
        )}
        <div className="absolute bottom-2 left-2 flex gap-1">
          <span className="rounded bg-white/85 px-2 py-0.5 text-[10px] text-wink-ink">
            {compact ? intentLabel(card.intent) : `${card.type} · ${intentLabel(card.intent)}`}
          </span>
          {slides > 1 && (
            <span className="flex items-center gap-0.5 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white">
              <Layers size={9} color="#fff" />
              {slides}
            </span>
          )}
        </div>
        {(extra.status === "hold" || extra.promoted) && (
          <span className="absolute bottom-2 right-2 rounded bg-wink-purple px-1.5 py-0.5 text-[8px] font-bold text-white">
            {extra.status === "hold" ? "ON HOLD" : "PROMOTED"}
          </span>
        )}

        <div className="absolute right-2 top-2 flex gap-1">
          <span
            role="button"
            aria-label={inCart ? "Remove from cart" : "Add to cart"}
            onClick={(e) => {
              e.stopPropagation();
              toggleCart(card.id);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full"
            style={{ background: inCart ? "#5CC0A8" : "rgba(255,255,255,0.92)" }}
          >
            <ShoppingCart size={11} color={inCart ? "#fff" : "#9A9A9A"} />
          </span>
          <span
            role="button"
            aria-label={liked ? "Remove from likes" : "Add to likes"}
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(card.id);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90"
          >
            <Heart
              size={11}
              color={liked ? "#D4759A" : "#9A9A9A"}
              fill={liked ? "#D4759A" : "none"}
            />
          </span>
        </div>
      </div>

      <div className={compact ? "p-1.5" : "p-2.5"}>
        <div className="text-[11px] font-bold text-wink-pink">{card.memberName}</div>
        <div className="truncate text-[11px] text-wink-muted">{card.era}</div>
        <div className="mt-1 font-display font-bold text-wink-ink">${card.price.toFixed(2)}</div>
        <div className="text-[10px] text-wink-muted">@{card.sellerUsername}</div>
      </div>
    </button>
  );
}
