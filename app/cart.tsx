import { View } from "react-native";
import { ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Trash2 } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, EmptyState, PhotocardImage, Text } from "@/components";
import { getPhotocard } from "@/data/photocards";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/** Buyer convenience fee from the research's fee model (framed as protection). */
const BUYER_FEE_RATE = 0.05;

export default function CartScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const toggleCart = useUserStore((s) => s.toggleCart);

  const cards = (user?.cartIds ?? [])
    .map(getPhotocard)
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const subtotal = cards.reduce((sum, c) => sum + c.price, 0);
  const fee = subtotal * BUYER_FEE_RATE;
  const total = subtotal + fee;

  return (
    <SafeAreaView className="flex-1 bg-wink-purple-tint" edges={["top"]}>
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <Text className="font-display text-lg text-wink-ink">Cart</Text>
      </View>

      {cards.length === 0 ? (
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          subtitle="Add cards you want to buy and check out in one go."
        />
      ) : (
        <>
          <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
            <View className="gap-3 pt-2">
              {cards.map((card) => (
                <View
                  key={card.id}
                  className="flex-row items-center gap-3 rounded-card border border-wink-pink-border bg-white p-3"
                >
                  <View className="w-12">
                    <PhotocardImage
                      groupId={card.groupId}
                      memberName={card.memberName}
                      imgSeed={card.imgSeed}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-display text-wink-ink" numberOfLines={1}>
                      {card.memberName} · {card.era}
                    </Text>
                    <Text className="text-xs text-wink-muted">
                      {card.type} · @{card.sellerUsername}
                    </Text>
                    <Text className="mt-1 font-display text-wink-ink">
                      ${card.price.toFixed(2)}
                    </Text>
                  </View>
                  <Pressable onPress={() => toggleCart(card.id)} hitSlop={8}>
                    <Trash2 size={18} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>

          <View className="border-t border-wink-pink-border bg-white px-5 pb-8 pt-4">
            <Row
              label={`Subtotal (${cards.length} card${cards.length > 1 ? "s" : ""})`}
              value={subtotal}
            />
            <Row label="Buyer protection (5%)" value={fee} />
            <View className="my-2 h-px bg-wink-pink-border" />
            <Row label="Total" value={total} bold />
            <View className="mt-4">
              <Button title="Checkout securely" fullWidth onPress={() => router.back()} />
            </View>
            <Text className="mt-2 text-center text-xs text-wink-muted">
              Zero seller fees · payment held until you confirm delivery
            </Text>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-0.5">
      <Text className={bold ? "font-display text-wink-ink" : "text-sm text-wink-muted"}>
        {label}
      </Text>
      <Text className={bold ? "font-display text-wink-ink" : "text-sm text-wink-ink"}>
        ${value.toFixed(2)}
      </Text>
    </View>
  );
}
