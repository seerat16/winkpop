import { useState } from "react";
import { View } from "@/rn";
import { useRouter } from "@/rn/router";
import { Button, Card, Chip, Field, Notice, Page, SectionTitle, Text, Toggle } from "@/components";
import { customsFees, quoteLabels, SHIPPING_METHOD_LABELS, type ShippingMethod } from "@/data";
import { useUserStore } from "@/data/userStore";

/**
 * Shipping setup (§19A–D, §19G, §1V): four individually-priced options (blank
 * = not offered), free shipping, address (never public), package size/weight
 * label quotes, and customs estimates.
 */
export default function ShippingSettingsScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const [prices, setPrices] = useState<Record<ShippingMethod, string>>({
    domesticStamped: user?.shipping?.domesticStamped?.toString() ?? "",
    domesticTracked: user?.shipping?.domesticTracked?.toString() ?? "",
    intlStamped: user?.shipping?.intlStamped?.toString() ?? "",
    intlTracked: user?.shipping?.intlTracked?.toString() ?? "",
  });
  const [free, setFree] = useState(user?.shipping?.freeShipping ?? false);
  const [address, setAddress] = useState({
    line1: user?.address?.line1 ?? "",
    line2: user?.address?.line2 ?? "",
    city: user?.address?.city ?? "",
    region: user?.address?.region ?? "",
    country: user?.address?.country ?? user?.country ?? "US",
    zip: user?.address?.zip ?? "",
  });
  const [weight, setWeight] = useState("1");
  const [intl, setIntl] = useState(false);
  const [saved, setSaved] = useState(false);
  const quotes = quoteLabels(Number(weight) || 1, intl);
  const customs = customsFees("CA", 20);

  const save = () => {
    const parsed = Object.fromEntries(
      (Object.keys(prices) as ShippingMethod[]).map((k) => [k, prices[k].trim() === "" ? undefined : Number(prices[k])]),
    ) as Record<ShippingMethod, number | undefined>;
    updateUser({ shipping: { ...parsed, freeShipping: free }, address: address.line1 ? address : user?.address });
    setSaved(true);
    setTimeout(() => router.back(), 300);
  };

  return (
    <Page title="Shipping" footer={<Button title="Save shipping" fullWidth onPress={save} />}>
      {saved ? <Notice tone="success" text="Saved!" /> : null}
      <Text className="mb-3 text-sm text-wink-muted">Leave an option blank and it simply won&apos;t be offered on your listings.</Text>
      {(Object.keys(SHIPPING_METHOD_LABELS) as ShippingMethod[]).map((m) => (
        <Field key={m} label={`${SHIPPING_METHOD_LABELS[m]} ($)`} keyboardType="decimal-pad" value={prices[m]} onChangeText={(t) => setPrices((p) => ({ ...p, [m]: t }))} placeholder="Not offered" />
      ))}
      <Toggle label="Offer free shipping" sub="Buyers see 'Free shipping' on all your listings" value={free} onChange={setFree} />

      <SectionTitle title="Return address (never shown publicly)" />
      <Field label="Address line 1" value={address.line1} onChangeText={(t) => setAddress({ ...address, line1: t })} />
      <Field label="Address line 2" value={address.line2} onChangeText={(t) => setAddress({ ...address, line2: t })} />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Field label="City" value={address.city} onChangeText={(t) => setAddress({ ...address, city: t })} />
        </View>
        <View className="flex-1">
          <Field label="State / region" value={address.region} onChangeText={(t) => setAddress({ ...address, region: t })} />
        </View>
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Field label="Country" value={address.country} onChangeText={(t) => setAddress({ ...address, country: t })} />
        </View>
        <View className="flex-1">
          <Field label="ZIP" value={address.zip} onChangeText={(t) => setAddress({ ...address, zip: t })} />
        </View>
      </View>

      <SectionTitle title="Label calculator" />
      <View className="flex-row items-end gap-2">
        <View className="w-28">
          <Field label="Weight (oz)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
        </View>
        <View className="mb-3 flex-row gap-2">
          <Chip label="Domestic" active={!intl} onPress={() => setIntl(false)} />
          <Chip label="International" active={intl} onPress={() => setIntl(true)} />
        </View>
      </View>
      <Card>
        {quotes.map((q) => (
          <View key={q.carrier} className="flex-row justify-between py-1">
            <Text className="text-sm text-wink-ink">{q.carrier}</Text>
            <Text className="text-sm text-wink-muted">
              ${q.price.toFixed(2)} · {q.days} days
            </Text>
          </View>
        ))}
      </Card>
      {customs ? <Text className="mt-2 text-xs text-wink-muted">Heads up: shipping to Canada adds {customs.label} (≈${customs.amount.toFixed(2)} on a $20 card).</Text> : null}
      <Button title="Packing & shipping tutorial" variant="ghost" fullWidth onPress={() => router.push("/tutorial?section=packing")} />
    </Page>
  );
}
