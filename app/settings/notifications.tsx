import { useState } from "react";
import { View } from "react-native";
import { Chip, Field, Page, SectionTitle, Text, Toggle } from "@/components";
import { GROUP_MAP, PAYMENT_LABELS, type PaymentMethod } from "@/data";
import { useUserStore } from "@/data/userStore";

/**
 * Notification preferences (§17B) and smart-match filters by payment type,
 * price, location and currency (§9Q). Followed groups (§4L) and saved
 * searches can be switched off here too.
 */
export default function NotificationSettingsScreen() {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const toggleFollowGroup = useUserStore((s) => s.toggleFollowGroup);
  const [maxPrice, setMaxPrice] = useState(user?.notificationPrefs.maxPrice?.toString() ?? "");
  if (!user) return null;
  const p = user.notificationPrefs;
  const set = (patch: Partial<typeof p>) => updateUser({ notificationPrefs: { ...p, ...patch } });

  return (
    <Page title="Notifications">
      <Toggle label="Wishlist matches" value={p.wishlist} onChange={(v) => set({ wishlist: v })} />
      <Toggle label="Smart trades" value={p.trades} onChange={(v) => set({ trades: v })} />
      <Toggle label="Offers & counter offers" value={p.offers} onChange={(v) => set({ offers: v })} />
      <Toggle label="Orders & shipping" value={p.orders} onChange={(v) => set({ orders: v })} />
      <Toggle label="Followers, likes & comments" value={p.social} onChange={(v) => set({ social: v })} />
      <Toggle label="Followed groups & events" value={p.groups} onChange={(v) => set({ groups: v })} />

      <SectionTitle title="Smart match filters" />
      <Field label="Only notify under ($)" keyboardType="decimal-pad" value={maxPrice} onChangeText={(t) => { setMaxPrice(t); set({ maxPrice: Number(t) || undefined }); }} placeholder="Any price" />
      <Toggle label="Domestic sellers only" value={p.domesticOnly} onChange={(v) => set({ domesticOnly: v })} />
      <Text className="mb-2 mt-2 text-sm text-wink-ink">Currency</Text>
      <View className="flex-row flex-wrap gap-2">
        {["Any", "USD", "CAD", "KRW", "GBP", "AUD"].map((c) => (
          <Chip key={c} label={c} active={(p.currency ?? "Any") === c} onPress={() => set({ currency: c === "Any" ? undefined : c })} />
        ))}
      </View>
      <Text className="mb-2 mt-3 text-sm text-wink-ink">Seller accepts</Text>
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Any payment" active={!p.paymentMethod} onPress={() => set({ paymentMethod: undefined })} />
        {(["paypal", "venmo", "zelle", "card"] as PaymentMethod[]).map((m) => (
          <Chip key={m} label={PAYMENT_LABELS[m]} active={p.paymentMethod === m} onPress={() => set({ paymentMethod: m })} />
        ))}
      </View>

      <SectionTitle title="Followed groups" />
      {user.followedGroupIds.length === 0 ? <Text className="text-sm text-wink-muted">Follow a group from its page to get new-listing alerts.</Text> : null}
      {user.followedGroupIds.map((g) => (
        <Toggle key={g} label={GROUP_MAP[g]?.name ?? g} value onChange={() => toggleFollowGroup(g)} />
      ))}
      <SectionTitle title="Saved searches" />
      {user.savedSearches.length === 0 ? <Text className="text-sm text-wink-muted">Save a search in Browse to get alerts.</Text> : null}
      {user.savedSearches.map((s) => (
        <Toggle
          key={s.id}
          label={s.label}
          value={s.notify}
          onChange={(v) => updateUser({ savedSearches: user.savedSearches.map((x) => (x.id === s.id ? { ...x, notify: v } : x)) })}
        />
      ))}
    </Page>
  );
}
