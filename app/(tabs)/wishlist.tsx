import { useMemo, useState } from "react";
import { View } from "react-native";
import { Chip, EmptyState, PhotocardTile, Screen, Text } from "@/components";
import { getPhotocard } from "@/data/photocards";
import { useUserStore } from "@/data/userStore";

type Tab = "wishlist" | "likes" | "collection";

/**
 * Collection & wishlist management (MVP: wishlist/saving stage). Three sub-tabs
 * separate the distinct actions the research called out — wishlist (want),
 * likes (saved/liked), and collection (have).
 */
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
    <Screen padded={false}>
      <View className="px-4 pt-2">
        <Text className="mb-4 font-display text-2xl text-wink-ink">My Cards</Text>
        <View className="mb-4 flex-row gap-2">
          <Chip label="Wishlist" active={tab === "wishlist"} onPress={() => setTab("wishlist")} />
          <Chip label="Likes" active={tab === "likes"} onPress={() => setTab("likes")} />
          <Chip
            label="Collection"
            active={tab === "collection"}
            onPress={() => setTab("collection")}
          />
        </View>

        {cards.length === 0 ? (
          <EmptyState emoji="💜" title={copy[tab].empty} subtitle={copy[tab].sub} />
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {cards.map((card) => (
              <View key={card.id} className="mb-3 w-[48.5%]">
                <PhotocardTile card={card} />
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
