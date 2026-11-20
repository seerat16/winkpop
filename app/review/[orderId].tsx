import { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { Button, Chip, EmptyState, Field, Page, Text } from "@/components";
import { REVIEW_TAGS, type Review, type ReviewTag } from "@/data";
import { useAppStore } from "@/data/appStore";
import { colors } from "@/theme/colors";

/** Write a review after a sale, purchase or trade (§21B–D). */
export default function WriteReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const order = useAppStore((s) => s.orders.find((o) => o.id === orderId));
  const leaveReview = useAppStore((s) => s.leaveReview);
  const [stars, setStars] = useState<Review["stars"]>(5);
  const [tags, setTags] = useState<ReviewTag[]>([]);
  const [text, setText] = useState("");

  if (!order) return <Page title="Review">{<EmptyState title="Order not found" />}</Page>;
  return (
    <Page title={`Review @${order.counterparty}`}>
      <Text className="mb-2 text-sm text-wink-muted">{order.cardTitle}</Text>
      <View className="mb-4 flex-row justify-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable key={i} accessibilityLabel={`${i} stars`} onPress={() => setStars(i as Review["stars"])}>
            <Star size={36} color={colors.warn} fill={i <= stars ? colors.warn : "none"} />
          </Pressable>
        ))}
      </View>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {REVIEW_TAGS.map((t) => (
          <Chip key={t} label={t} active={tags.includes(t)} onPress={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} />
        ))}
      </View>
      <Field label="Your review" multiline value={text} onChangeText={setText} placeholder="How did it go?" />
      <Button
        title="Submit review"
        fullWidth
        onPress={() => {
          leaveReview(
            { subject: order.counterparty, stars, role: order.kind === "buy" ? "purchase" : order.kind === "sell" ? "sale" : "trade", cardTitle: order.cardTitle, text: text.trim() || "Great transaction!", tags },
            order.id,
          );
          router.back();
        }}
      />
      <Text className="mt-3 text-center text-xs text-wink-muted">If you don&apos;t review a completed sale, a 5-star review is left automatically.</Text>
    </Page>
  );
}
