import { useState } from "react";
import { View } from "@/rn";
import { useLocalSearchParams, useRouter } from "@/rn/router";
import { CheckCircle2 } from "lucide-react";
import { Button, Card, Chip, EmptyState, Page, PhotocardImage, Text } from "@/components";
import { BUYER_FEE_RATE, PAYMENT_LABELS, round2 } from "@/data";
import { getAnyListing, listingName, useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";
import { openStripe, startCheckout } from "@/lib/payments";

/** Buy Now — single-card checkout (§7V): wallet or card, summary, pay. */
export default function BuyNowScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const card = getAnyListing(id ?? "");
  const wallet = useUserStore((s) => s.user?.walletBalance ?? 0);
  const checkout = useAppStore((s) => s.checkout);
  const [method, setMethod] = useState<"wallet" | "card">(wallet >= (card?.price ?? 0) * 1.05 ? "wallet" : "card");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!card) return <Page title="Buy now">{<EmptyState title="Listing not found" />}</Page>;
  const fee = round2(card.price * BUYER_FEE_RATE);
  const total = round2(card.price + fee);

  if (done) {
    return (
      <Page title="Purchase complete">
        <View className="items-center py-10">
          <CheckCircle2 size={56} color={colors.mint} />
          <Text className="mt-3 font-display text-xl text-wink-ink">Purchase complete</Text>
          <Text className="mt-1 text-center text-sm text-wink-muted">@{card.sellerUsername} has been notified to ship. Payment is held until you confirm delivery.</Text>
        </View>
        <View className="gap-2">
          <Button title="View purchases" fullWidth onPress={() => router.replace("/(tabs)/transactions?tab=buying")} />
          <Button title="Continue browsing" variant="secondary" fullWidth onPress={() => router.replace("/(tabs)/home")} />
        </View>
      </Page>
    );
  }

  return (
    <Page title="Buy now">
      <Card className="flex-row items-center gap-3">
        <View className="w-16">
          <PhotocardImage groupId={card.groupId} memberName={card.memberName} imgSeed={card.imgSeed} />
        </View>
        <View className="flex-1">
          <Text className="font-display text-wink-ink">{listingName(card)}</Text>
          <Text className="text-xs text-wink-muted">
            {card.era} · {card.type}
          </Text>
          <Text className="mt-1 font-display text-wink-ink">${card.price.toFixed(2)}</Text>
        </View>
      </Card>
      <Text className="mb-2 mt-5 font-display text-wink-ink">Pay with</Text>
      <View className="flex-row gap-2">
        <Chip label={`${PAYMENT_LABELS.wallet} ($${wallet.toFixed(2)})`} active={method === "wallet"} onPress={() => setMethod("wallet")} />
        <Chip label={PAYMENT_LABELS.card} active={method === "card"} onPress={() => setMethod("card")} />
      </View>
      <Card className="mt-5">
        <Row label="Price" value={card.price} />
        <Row label="Service fee (5%)" value={fee} />
        <View className="my-2 h-px bg-wink-pink-border" />
        <Row label="Total" value={total} bold />
      </Card>
      {error ? <Text className="mt-2 text-center text-sm text-wink-pink">{error}</Text> : null}
      <View className="mt-5">
        <Button
          title={`Pay $${total.toFixed(2)}`}
          fullWidth
          disabled={!card.available}
          onPress={async () => {
            try {
              const live = await startCheckout([card.id]);
              if (!live.demo) return openStripe(live.url);
            } catch (e) {
              return setError((e as Error).message);
            }
            const r = checkout([card.id], { payment: method });
            if (!r.success) setError(r.error ?? "Payment failed");
            else setDone(true);
          }}
        />
      </View>
    </Page>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-0.5">
      <Text className={bold ? "font-display text-wink-ink" : "text-sm text-wink-muted"}>{label}</Text>
      <Text className={bold ? "font-display text-wink-ink" : "text-sm text-wink-ink"}>${value.toFixed(2)}</Text>
    </View>
  );
}
