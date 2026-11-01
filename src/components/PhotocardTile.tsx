import { Pressable, View } from "react-native";
import { Heart, ShoppingCart } from "lucide-react-native";
import { useRouter } from "expo-router";
import type { Photocard } from "@/data/types";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";
import { PhotocardImage } from "./PhotocardImage";
import { Text } from "./Text";

/**
 * A single photocard card in a grid. Reused by Home, Browse, Wishlist, Likes,
 * and group detail — the most-reused content component in the app.
 */
export function PhotocardTile({ card }: { card: Photocard }) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const toggleLike = useUserStore((s) => s.toggleLike);
  const toggleCart = useUserStore((s) => s.toggleCart);

  const liked = user?.likesIds.includes(card.id) ?? false;
  const inCart = user?.cartIds.includes(card.id) ?? false;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/card/${card.id}`)}
      className="overflow-hidden rounded-card border border-wink-pink-border bg-white"
      style={{ opacity: card.available ? 1 : 0.6 }}
    >
      <View className="relative">
        <PhotocardImage
          groupId={card.groupId}
          memberName={card.memberName}
          imgSeed={card.imgSeed}
        />

        {!card.available && (
          <View className="absolute inset-0 items-center justify-center bg-black/35">
            <Text className="rounded bg-black/50 px-2 py-0.5 font-display text-xs text-white">
              SOLD OUT
            </Text>
          </View>
        )}
        {card.damaged && (
          <View className="absolute left-2 top-2 rounded bg-wink-warn px-1.5 py-0.5">
            <Text className="font-display text-white" style={{ fontSize: 8 }}>
              ⚠ DMG
            </Text>
          </View>
        )}
        <View className="absolute left-2 bottom-2 rounded bg-white/85 px-2 py-0.5">
          <Text className="text-wink-ink" style={{ fontSize: 10 }}>
            {card.type}
          </Text>
        </View>

        <View className="absolute right-2 top-2 flex-row gap-1">
          <Pressable
            testID="Add to cart"
            accessibilityRole="button"
            accessibilityLabel={inCart ? "Remove from cart" : "Add to cart"}
            onPress={() => toggleCart(card.id)}
            hitSlop={6}
            className="h-6 w-6 items-center justify-center rounded-full"
            style={{ backgroundColor: inCart ? colors.mint : "rgba(255,255,255,0.92)" }}
          >
            <ShoppingCart size={11} color={inCart ? colors.white : colors.muted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={liked ? "Remove from likes" : "Add to likes"}
            onPress={() => toggleLike(card.id)}
            hitSlop={6}
            className="h-6 w-6 items-center justify-center rounded-full bg-white/90"
          >
            <Heart
              size={11}
              color={liked ? colors.pink : colors.muted}
              fill={liked ? colors.pink : "none"}
            />
          </Pressable>
        </View>
      </View>

      <View className="p-2.5">
        <Text className="font-display text-wink-pink" style={{ fontSize: 11 }}>
          {card.memberName}
        </Text>
        <Text className="text-wink-muted" style={{ fontSize: 11 }} numberOfLines={1}>
          {card.era}
        </Text>
        <Text className="mt-1 font-display text-wink-ink">${card.price.toFixed(2)}</Text>
        <Text className="text-wink-muted" style={{ fontSize: 10 }}>
          @{card.sellerUsername}
        </Text>
      </View>
    </Pressable>
  );
}
