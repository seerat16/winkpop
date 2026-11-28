import { CheckCircle2, XCircle } from "lucide-react";
import { Button, Page, Text } from "@/components";
import { View } from "@/rn";
import { useLocalSearchParams, useRouter } from "@/rn/router";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Where Stripe Checkout sends the buyer back (§7Z). The order is only marked
 * paid by the server's webhook — this page never trusts the URL for that.
 */
export default function CheckoutReturnScreen() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const removeFromCart = useUserStore((s) => s.removeFromCart);
  const ok = status === "success";

  return (
    <Page title={ok ? "Purchase complete" : "Checkout cancelled"}>
      <View className="items-center py-10">
        {ok ? <CheckCircle2 size={56} color={colors.mint} /> : <XCircle size={56} color={colors.pink} />}
        <Text className="mt-3 font-display text-xl text-wink-ink">{ok ? "Purchase Successful!" : "No charge was made"}</Text>
        <Text className="mt-1 text-center text-sm text-wink-muted">
          {ok
            ? "Your payment is held safely until you confirm delivery. Sellers have been notified to ship."
            : "Your cards are still in your cart — they're held for a few minutes if you want to try again."}
        </Text>
      </View>
      <View className="gap-2">
        {ok ? (
          <Button
            title="View purchases"
            fullWidth
            onPress={() => {
              if (user) removeFromCart(user.cartIds);
              router.replace("/(tabs)/transactions?tab=buying");
            }}
          />
        ) : (
          <Button title="Back to cart" fullWidth onPress={() => router.replace("/cart")} />
        )}
        <Button title="Back to Home" variant="secondary" fullWidth onPress={() => router.replace("/(tabs)/home")} />
      </View>
    </Page>
  );
}
