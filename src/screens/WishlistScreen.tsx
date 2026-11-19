import { useMemo, useState } from "react";
import { PhotocardTile } from "@/components/PhotocardTile";
import { Chip, EmptyState } from "@/components/ui";
import { getPhotocard } from "@/data/photocards";
import { useUserStore } from "@/data/userStore";

type Tab = "wishlist" | "likes" | "collection";

export default function WishlistScreen() {
  const user = useUserStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("wishlist");

  const ids = useMemo(() => {
    if (!user) return [];
    if (tab === "wishlist") return user.wishlistIds;
    if (tab === "likes") return user.likesIds;
    return user.collectionIds;
  }, [user, tab]);

  const cards = ids.map(getPhotocard).filter((c): c is NonNullable<typeof c> => Boolean(c));

  const copy: Record<Tab, { empty: string; sub: string }> = {
    wishlist: {
      empty: "Your wishlist is empty",
      sub: "Add cards you're hunting for — we'll match them to listings.",
    },
    likes: { empty: "No liked cards yet", sub: "Tap the heart on any card to save it here." },
    collection: {
      empty: "No cards in your collection",
      sub: "Track the cards you own in your digital binder.",
    },
  };

  return (
    <div className="px-4 pt-2">
      <h1 className="mb-4 font-display text-2xl font-extrabold text-wink-ink">My Cards</h1>
      <div className="mb-4 flex gap-2">
        <Chip label="Wishlist" active={tab === "wishlist"} onClick={() => setTab("wishlist")} />
        <Chip label="Likes" active={tab === "likes"} onClick={() => setTab("likes")} />
        <Chip
          label="Collection"
          active={tab === "collection"}
          onClick={() => setTab("collection")}
        />
      </div>

      {cards.length === 0 ? (
        <EmptyState emoji="💜" title={copy[tab].empty} subtitle={copy[tab].sub} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <PhotocardTile key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
