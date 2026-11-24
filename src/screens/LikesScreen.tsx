import { useRouter } from "@/rn/router";
import { Button, EmptyState, ListingGrid, Page, Text } from "@/components";
import type { Photocard } from "@/data";
import { getAnyListing, EMPTY } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";

/** Liked listings (§4T, §7J). Unliking removes the card from this page. */
export default function LikesScreen() {
  const router = useRouter();
  const ids = useUserStore((s) => s.user?.likesIds ?? EMPTY);
  const cards = ids.map(getAnyListing).filter((c): c is Photocard => Boolean(c));
  return (
    <Page title="Likes">
      <Text className="mb-3 text-sm text-wink-muted">{cards.length} liked</Text>
      {cards.length ? (
        <ListingGrid cards={cards} />
      ) : (
        <>
          <EmptyState emoji="💗" title="No liked posts yet" subtitle="Tap the heart on any listing to keep it here." />
          <Button title="Browse Discover" fullWidth onPress={() => router.push("/(tabs)/home")} />
        </>
      )}
    </Page>
  );
}
