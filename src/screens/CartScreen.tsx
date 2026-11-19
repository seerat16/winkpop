import { useNavigate } from "react-router-dom";
import { ChevronLeft, Trash2 } from "lucide-react";
import { PhotocardImage } from "@/components/PhotocardImage";
import { Button, EmptyState } from "@/components/ui";
import { getPhotocard } from "@/data/photocards";
import { useUserStore } from "@/data/userStore";

const BUYER_FEE_RATE = 0.05;

export default function CartScreen() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const toggleCart = useUserStore((s) => s.toggleCart);

  const cards = (user?.cartIds ?? [])
    .map(getPhotocard)
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const subtotal = cards.reduce((sum, c) => sum + c.price, 0);
  const fee = subtotal * BUYER_FEE_RATE;
  const total = subtotal + fee;

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 px-4 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <ChevronLeft size={20} color="#2D2D2D" />
        </button>
        <h1 className="font-display text-lg font-bold text-wink-ink">Cart</h1>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          subtitle="Add cards you want to buy and check out in one go."
        />
      ) : (
        <>
          <div className="space-y-3 px-4 pt-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-3 rounded-card border border-wink-pink-border bg-white p-3"
              >
                <div className="w-12">
                  <PhotocardImage
                    groupId={card.groupId}
                    memberName={card.memberName}
                    imgSeed={card.imgSeed}
                    className="w-full rounded-lg"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display font-bold text-wink-ink">
                    {card.memberName} · {card.era}
                  </div>
                  <div className="text-xs text-wink-muted">
                    {card.type} · @{card.sellerUsername}
                  </div>
                  <div className="mt-1 font-display font-bold text-wink-ink">
                    ${card.price.toFixed(2)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleCart(card.id)}
                  aria-label="Remove from cart"
                >
                  <Trash2 size={18} color="#9A9A9A" />
                </button>
              </div>
            ))}
          </div>

          <div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-wink-pink-border bg-white px-5 pt-4"
            style={{ paddingBottom: "calc(var(--sab) + 16px)" }}
          >
            <Row
              label={`Subtotal (${cards.length} card${cards.length > 1 ? "s" : ""})`}
              value={subtotal}
            />
            <Row label="Buyer protection (5%)" value={fee} />
            <div className="my-2 h-px bg-wink-pink-border" />
            <Row label="Total" value={total} bold />
            <div className="mt-4">
              <Button fullWidth onClick={() => navigate(-1)}>
                Checkout securely
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-wink-muted">
              Zero seller fees · payment held until you confirm delivery
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className={bold ? "font-display font-bold text-wink-ink" : "text-sm text-wink-muted"}>
        {label}
      </span>
      <span className={bold ? "font-display font-bold text-wink-ink" : "text-sm text-wink-ink"}>
        ${value.toFixed(2)}
      </span>
    </div>
  );
}
