import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Heart, ShoppingCart, TrendingUp } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Pressable } from "react-native";
import { Button, PhotocardImage, Text } from "@/components";
import { getPhotocard } from "@/data/photocards";
import { getPriceHistory, getPriceStats } from "@/data/priceHistory";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const card = getPhotocard(id ?? "");

  const user = useUserStore((s) => s.user);
  const toggleLike = useUserStore((s) => s.toggleLike);
  const toggleCart = useUserStore((s) => s.toggleCart);
  const toggleWishlist = useUserStore((s) => s.toggleWishlist);

  if (!card) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-wink-purple-tint">
        <Text className="text-wink-muted">Card not found</Text>
      </SafeAreaView>
    );
  }

  const liked = user?.likesIds.includes(card.id) ?? false;
  const inCart = user?.cartIds.includes(card.id) ?? false;
  const wishlisted = user?.wishlistIds.includes(card.id) ?? false;

  const stats = getPriceStats(card.id);
  const history = getPriceHistory(card.id);
  const maxPrice = Math.max(...history.map((h) => h.price), 1);

  return (
    <SafeAreaView className="flex-1 bg-wink-purple-tint" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <Pressable
          onPress={() => toggleLike(card.id)}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <Heart
            size={18}
            color={liked ? colors.pink : colors.muted}
            fill={liked ? colors.pink : "none"}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="items-center px-6 pt-2">
          <View className="w-2/3">
            <PhotocardImage
              groupId={card.groupId}
              memberName={card.memberName}
              imgSeed={card.imgSeed}
            />
          </View>
        </View>

        <View className="px-5 pt-5">
          <Text className="font-display text-wink-pink">{card.groupName}</Text>
          <Text className="font-display text-xl text-wink-ink">
            {card.memberName} · {card.era}
          </Text>
          <Text className="mt-1 text-sm text-wink-muted">
            {card.type} · {card.condition} · @{card.sellerUsername}
          </Text>

          <View className="mt-4 flex-row items-end gap-2">
            <Text className="font-display text-3xl text-wink-ink">${card.price.toFixed(2)}</Text>
            {card.intent !== "sale" ? (
              <View className="mb-1 rounded-pill bg-wink-purple-tint px-2 py-0.5">
                <Text className="text-xs text-wink-purple">
                  {card.intent === "trade" ? "Trade only" : "Sale or trade"}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Price intelligence — the "StockX for photocards" layer */}
          {stats ? (
            <View className="mt-5 rounded-card border border-wink-pink-border bg-white p-4">
              <View className="mb-3 flex-row items-center gap-2">
                <TrendingUp size={16} color={colors.mint} />
                <Text className="font-display text-wink-ink">Price intelligence</Text>
              </View>
              <View className="mb-3 flex-row justify-between">
                <PriceStat label="Low" value={stats.low} />
                <PriceStat label="Avg" value={stats.avg} highlight />
                <PriceStat label="High" value={stats.high} />
                <PriceStat label="Last" value={stats.last} />
              </View>
              {/* lightweight sparkline */}
              <View className="h-16 flex-row items-end gap-0.5">
                {history.map((h, i) => (
                  <View
                    key={i}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${(h.price / maxPrice) * 100}%`,
                      backgroundColor: colors.purpleSoft,
                    }}
                  />
                ))}
              </View>
              <Text className="mt-2 text-xs text-wink-muted">
                Recent sales suggest ${stats.low.toFixed(0)}–${stats.high.toFixed(0)} for this card.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* sticky action bar */}
      <View className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-wink-pink-border bg-white px-5 pb-8 pt-4">
        <View className="flex-1">
          <Button
            title={wishlisted ? "On wishlist" : "Add to wishlist"}
            variant="secondary"
            fullWidth
            onPress={() => toggleWishlist(card.id)}
          />
        </View>
        <View className="flex-1">
          <Button
            title={inCart ? "In cart" : "Add to cart"}
            variant={inCart ? "mint" : "primary"}
            fullWidth
            icon={<ShoppingCart size={16} color={colors.white} />}
            onPress={() => toggleCart(card.id)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function PriceStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <View className="items-center">
      <Text className={`font-display ${highlight ? "text-wink-pink" : "text-wink-ink"}`}>
        ${value.toFixed(0)}
      </Text>
      <Text className="text-xs text-wink-muted">{label}</Text>
    </View>
  );
}
