import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Heart, Search, ShoppingCart } from "lucide-react-native";
import { Chip, Logo, PhotocardTile, Screen, Text } from "@/components";
import { PHOTOCARDS } from "@/data/photocards";
import { searchPhotocards } from "@/data/search";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

type Feed = "suggested" | "new";

export default function HomeScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const [feed, setFeed] = useState<Feed>("suggested");

  const cards = useMemo(() => {
    // "Suggested" prioritises the groups the user collects, then popularity.
    if (feed === "new") {
      return searchPhotocards(PHOTOCARDS, { sort: "new" }).slice(0, 16);
    }
    const collecting = new Set(user?.collectingGroupIds ?? []);
    const ranked = searchPhotocards(PHOTOCARDS, { sort: "popular" });
    const mine = ranked.filter((c) => collecting.has(c.groupId));
    const rest = ranked.filter((c) => !collecting.has(c.groupId));
    return [...mine, ...rest].slice(0, 16);
  }, [feed, user?.collectingGroupIds]);

  const cartCount = user?.cartIds.length ?? 0;

  return (
    <Screen padded={false}>
      <View className="px-4 pt-2">
        {/* header */}
        <View className="mb-3 flex-row items-center justify-between">
          <Logo size={40} showWordmark={false} />
          <View className="flex-row items-center gap-4">
            <Pressable
              testID="cart"
              accessibilityRole="button"
              accessibilityLabel="cart"
              onPress={() => router.push("/cart")}
              className="relative"
              hitSlop={8}
            >
              <ShoppingCart size={21} color={colors.muted} />
              {cartCount > 0 ? (
                <View className="absolute -right-2 -top-2 h-4 w-4 items-center justify-center rounded-full bg-wink-pink">
                  <Text className="font-display text-white" style={{ fontSize: 9 }}>
                    {cartCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={() => router.push("/(tabs)/wishlist")} hitSlop={8}>
              <Heart size={21} color={colors.muted} />
            </Pressable>
          </View>
        </View>

        {/* search entry */}
        <Pressable
          onPress={() => router.push("/(tabs)/browse")}
          className="mb-3 flex-row items-center gap-3 rounded-card border border-wink-pink-border bg-white px-4 py-3"
        >
          <Search size={15} color={colors.muted} />
          <Text className="text-sm text-wink-muted">Search your favorite photocards…</Text>
        </Pressable>

        {/* feed tabs */}
        <View className="mb-4 flex-row gap-2">
          <Chip
            label="Suggested"
            active={feed === "suggested"}
            onPress={() => setFeed("suggested")}
          />
          <Chip label="New Drops" active={feed === "new"} onPress={() => setFeed("new")} />
        </View>

        {/* grid */}
        <View className="flex-row flex-wrap justify-between">
          {cards.map((card) => (
            <View key={card.id} className="mb-3 w-[48.5%]">
              <PhotocardTile card={card} />
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
