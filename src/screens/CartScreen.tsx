import { Pressable, SafeAreaView, ScrollView, TextInput, View } from "@/rn";
import { useMemo, useState } from "react";
import { useRouter } from "@/rn/router";
import { CheckCircle2, ChevronLeft, Circle, Plus, Trash2 } from "lucide-react";
import { Button, CatalogPicker, Chip, EmptyState, Notice, PhotocardImage, Text } from "@/components";
import {
  bundleDiscountRate,
  CART_EXPIRY_DAYS,
  PAYMENT_LABELS,
  priceCart,
  type PaymentMethod,
  type Photocard,
} from "@/data";
import { getAnyListing, useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";
import { openStripe, startCheckout } from "@/lib/payments";

const CHECKOUT_METHODS: PaymentMethod[] = ["wallet", "apple_pay", "google_pay", "klarna", "paypal", "card"];

/**
 * Cart & checkout (§7B–C, §7F, §7W–Z, §20M–O): select / delete items, add from
 * the database picker, bundle discounts per seller, coupons, payment method
 * (wallet shows balance), order summary with 5% service fee, and a purchase
 * confirmation that links to purchases.
 */
export default function CartScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const toggleCart = useUserStore((s) => s.toggleCart);
  const removeFromCart = useUserStore((s) => s.removeFromCart);
  const addToCart = useUserStore((s) => s.addToCart);
  const checkout = useAppStore((s) => s.checkout);
  useAppStore((s) => s.listings); // re-render when user listings change

  const cards = (user?.cartIds ?? []).map(getAnyListing).filter((c): c is Photocard => Boolean(c));
  const [deselected, setDeselected] = useState<string[]>([]);
  const [coupon, setCoupon] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [error, setError] = useState("");
  const [done, setDone] = useState<number | null>(null);
  const [picker, setPicker] = useState(false);

  const selected = cards.filter((c) => !deselected.includes(c.id));
  const quote = useMemo(() => priceCart(selected, coupon), [selected, coupon]);
  const allSelected = selected.length === cards.length;

  const [busy, setBusy] = useState(false);

  const purchase = async () => {
    setError("");
    if (selected.length === 0) return setError("Select at least one card to purchase.");
    // Live mode: pay through Stripe Checkout (server re-prices everything).
    setBusy(true);
    try {
      const live = await startCheckout(
        selected.map((c) => c.id),
        coupon || undefined,
      );
      if (!live.demo) return openStripe(live.url);
    } catch (e) {
      return setError((e as Error).message);
    } finally {
      setBusy(false);
    }
    const r = checkout(
      selected.map((c) => c.id),
      { payment, coupon: coupon || undefined },
    );
    if (!r.success) return setError(r.error ?? "Something went wrong.");
    setDone(r.orderIds?.length ?? 0);
  };

  if (done !== null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-wink-purple-tint px-8">
        <CheckCircle2 size={56} color={colors.mint} />
        <Text className="mt-4 font-display text-2xl text-wink-ink">Purchase Successful!</Text>
        <Text className="mt-2 text-center text-sm text-wink-muted">
          Your payment is held safely until you confirm delivery. Track {done === 1 ? "your order" : `your ${done} orders`} in Transactions.
        </Text>
        <View className="mt-6 w-full gap-2">
          <Button title="View purchases" fullWidth onPress={() => router.replace("/(tabs)/transactions?tab=buying")} />
          <Button title="Back to Home" variant="secondary" fullWidth onPress={() => router.replace("/(tabs)/home")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-wink-purple-tint" edges={["top"]}>
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Pressable accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full bg-white">
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <Text className="flex-1 font-display text-lg text-wink-ink">Cart</Text>
        <Pressable accessibilityLabel="Add cards from the database" onPress={() => setPicker(true)} className="flex-row items-center gap-1">
          <Plus size={16} color={colors.pink} />
          <Text className="text-sm text-wink-pink">Add</Text>
        </Pressable>
      </View>

      {cards.length === 0 ? (
        <View className="flex-1">
          <EmptyState emoji="🛒" title="Your cart is empty" subtitle="Add cards you want to buy and check out in one go." />
          <View className="px-10">
            <Button title="Browse Cards" fullWidth onPress={() => router.push("/(tabs)/home")} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
            <Notice text={`Items are auto-removed after ${CART_EXPIRY_DAYS} days. Prices and stock may change.`} />
            <View className="mb-2 flex-row items-center justify-between">
              <Pressable
                accessibilityLabel={allSelected ? "Deselect all" : "Select all"}
                onPress={() => setDeselected(allSelected ? cards.map((c) => c.id) : [])}
                className="flex-row items-center gap-2"
              >
                {allSelected ? <CheckCircle2 size={18} color={colors.pink} /> : <Circle size={18} color={colors.muted} />}
                <Text className="text-sm text-wink-ink">Select all ({selected.length}/{cards.length})</Text>
              </Pressable>
              <Pressable accessibilityLabel="Delete selected" disabled={!selected.length} onPress={() => removeFromCart(selected.map((c) => c.id))}>
                <Text className={`text-sm ${selected.length ? "text-wink-pink" : "text-wink-muted"}`}>Delete Selected</Text>
              </Pressable>
            </View>

            <View className="gap-3">
              {groupBySeller(cards).map(([seller, list]) => {
                const n = list.filter((c) => !deselected.includes(c.id)).length;
                const rate = bundleDiscountRate(n);
                return (
                  <View key={seller}>
                    <Text className="mb-1 text-xs text-wink-muted">
                      @{seller}
                      {rate ? ` · bundle discount ${Math.round(rate * 100)}% applied` : list.length === 1 ? " · add 1 more from this seller for 5% off" : ""}
                    </Text>
                    {list.map((card) => {
                      const on = !deselected.includes(card.id);
                      return (
                        <View key={card.id} className="mb-2 flex-row items-center gap-3 rounded-card border border-wink-pink-border bg-white p-3">
                          <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: on }}
                            accessibilityLabel={`Select ${card.title}`}
                            onPress={() => setDeselected((d) => (on ? [...d, card.id] : d.filter((x) => x !== card.id)))}
                          >
                            {on ? <CheckCircle2 size={20} color={colors.pink} /> : <Circle size={20} color={colors.muted} />}
                          </Pressable>
                          <Pressable className="w-12" onPress={() => router.push(`/card/${card.id}`)}>
                            <PhotocardImage groupId={card.groupId} memberName={card.memberName} imgSeed={card.imgSeed} />
                          </Pressable>
                          <View className="flex-1">
                            <Text className="font-display text-wink-ink" numberOfLines={1}>
                              {card.memberName} · {card.era}
                            </Text>
                            <Text className="text-xs text-wink-muted">{card.type}</Text>
                            <Text className="mt-1 text-sm text-wink-ink">{card.available ? `$${card.price.toFixed(2)}` : "No longer available"}</Text>
                          </View>
                          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${card.title} from cart`} onPress={() => toggleCart(card.id)} hitSlop={8}>
                            <Trash2 size={18} color={colors.muted} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>

            <Text className="mb-2 mt-4 font-display text-wink-ink">Coupon / credit</Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                value={coupon}
                onChangeText={setCoupon}
                autoCapitalize="characters"
                placeholder="Enter code"
                placeholderTextColor={colors.muted}
                className="flex-1 rounded-card border border-wink-pink-border bg-white px-4 py-2.5 text-wink-ink"
              />
              {coupon ? (
                <Pressable onPress={() => setCoupon("")}>
                  <Text className="text-sm text-wink-muted">Clear</Text>
                </Pressable>
              ) : null}
            </View>
            {user?.coupons.length ? (
              <View className="mt-2 flex-row flex-wrap gap-2">
                {user.coupons.map((c) => (
                  <Chip key={c} label={c} active={coupon.toUpperCase() === c} onPress={() => setCoupon(c)} />
                ))}
              </View>
            ) : null}
            {quote.couponError ? <Text className="mt-1 text-xs text-wink-pink">{quote.couponError}</Text> : null}

            <Text className="mb-2 mt-4 font-display text-wink-ink">Payment method</Text>
            <View className="flex-row flex-wrap gap-2">
              {CHECKOUT_METHODS.map((m) => (
                <Chip
                  key={m}
                  label={m === "wallet" ? `${PAYMENT_LABELS[m]} ($${(user?.walletBalance ?? 0).toFixed(2)})` : PAYMENT_LABELS[m]}
                  active={payment === m}
                  onPress={() => setPayment(m)}
                />
              ))}
            </View>
          </ScrollView>

          <View className="border-t border-wink-pink-border bg-white px-5 pb-8 pt-4">
            <Row label={`Subtotal (${selected.length} card${selected.length === 1 ? "" : "s"})`} value={quote.subtotal} />
            {quote.bundleDiscount ? <Row label="Bundle discount" value={-quote.bundleDiscount} /> : null}
            {quote.couponDiscount ? <Row label="Coupon" value={-quote.couponDiscount} /> : null}
            <Row label="Buyer protection (5%)" value={quote.serviceFee} />
            <View className="my-2 h-px bg-wink-pink-border" />
            <Row label="Total" value={quote.total} bold />
            {error ? <Text className="mt-2 text-center text-sm text-wink-pink">{error}</Text> : null}
            <View className="mt-4">
              <Button title="Checkout securely" fullWidth loading={busy} onPress={purchase} />
            </View>
            <Text className="mt-2 text-center text-xs text-wink-muted">Zero seller fees · payment held until you confirm delivery</Text>
          </View>
        </>
      )}

      <CatalogPicker
        visible={picker}
        mode="listings"
        title="Add to cart"
        cta="Add to Cart"
        onClose={() => setPicker(false)}
        onDone={(ids) => {
          addToCart(ids);
          setPicker(false);
        }}
      />
    </SafeAreaView>
  );
}

function groupBySeller(cards: Photocard[]): [string, Photocard[]][] {
  const m = new Map<string, Photocard[]>();
  for (const c of cards) m.set(c.sellerUsername, [...(m.get(c.sellerUsername) ?? []), c]);
  return [...m.entries()];
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-0.5">
      <Text className={bold ? "font-display text-wink-ink" : "text-sm text-wink-muted"}>{label}</Text>
      <Text className={bold ? "font-display text-wink-ink" : "text-sm text-wink-ink"}>
        {value < 0 ? `−$${Math.abs(value).toFixed(2)}` : `$${value.toFixed(2)}`}
      </Text>
    </View>
  );
}
