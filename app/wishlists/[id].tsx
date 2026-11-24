import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { Button, CatalogPicker, Chip, EmptyState, Field, Page, PhotocardImage, SectionTitle, Text, Toggle, UserRow } from "@/components";
import {
  getCatalogCard,
  GROUP_MAP,
  listingsForCatalog,
  whoHasWishlistCards,
  type PriorityLevel,
  type WishlistTag,
} from "@/data";
import { allListings, useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Wishlist detail (§12E–Q, §12U): priority star & level, WTB/WTT/ISO tag,
 * folder, show on profile, alerts, add/remove cards (no limit), who has these
 * cards right now, and trade / buy straight from the wishlist.
 */
export default function WishlistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const wishlist = useAppStore((s) => s.wishlists.find((w) => w.id === id));
  const update = useAppStore((s) => s.updateWishlist);
  const remove = useAppStore((s) => s.deleteWishlist);
  const alerts = useUserStore((s) => s.user?.notificationPrefs.wishlist ?? true);
  const [picker, setPicker] = useState(false);
  const [folder, setFolder] = useState(wishlist?.folder ?? "");
  const listings = useMemo(() => allListings(), []);

  if (!wishlist) return <Page title="Wishlist">{<EmptyState title="Wishlist not found" />}</Page>;
  const holders = whoHasWishlistCards(wishlist, listings);

  return (
    <Page
      title={wishlist.name}
      right={
        <Pressable accessibilityLabel={wishlist.priority ? "Remove priority" : "Mark priority"} onPress={() => update(wishlist.id, { priority: !wishlist.priority })}>
          <Star size={22} color={colors.warn} fill={wishlist.priority ? colors.warn : "none"} />
        </Pressable>
      }
    >
      <Text className="mb-3 text-sm text-wink-muted">
        {GROUP_MAP[wishlist.groupId]?.name} · {wishlist.cardIds.length + wishlist.descriptions.length} cards
      </Text>
      <View className="mb-2 flex-row flex-wrap gap-2">
        {(["high", "medium", "low"] as PriorityLevel[]).map((l) => (
          <Chip key={l} label={`${l} priority`} active={wishlist.level === l} onPress={() => update(wishlist.id, { level: l })} />
        ))}
      </View>
      <View className="mb-2 flex-row flex-wrap gap-2">
        {(["WTB", "WTT", "ISO"] as WishlistTag[]).map((t) => (
          <Chip key={t} label={t} active={wishlist.tag === t} onPress={() => update(wishlist.id, { tag: wishlist.tag === t ? undefined : t })} />
        ))}
      </View>
      <View className="flex-row items-end gap-2">
        <View className="flex-1">
          <Field label="Folder" value={folder} onChangeText={setFolder} placeholder="e.g. NewJeans" />
        </View>
        <View className="mb-3">
          <Button size="sm" title="Save" onPress={() => update(wishlist.id, { folder: folder.trim() || undefined })} />
        </View>
      </View>
      <Toggle label="Show on my profile & highlights" value={wishlist.showOnProfile} onChange={(v) => update(wishlist.id, { showOnProfile: v })} />
      <Toggle label="Alert me when a card is listed" sub="Manage all alerts in Settings → Notifications" value={alerts} onChange={() => router.push("/settings/notifications")} />

      <SectionTitle title="Cards" action="Add or remove cards" onAction={() => setPicker(true)} />
      <View className="flex-row flex-wrap gap-2">
        {wishlist.cardIds.map((cid) => {
          const c = getCatalogCard(cid);
          if (!c) return null;
          const live = listingsForCatalog(cid, listings)[0];
          return (
            <Pressable key={cid} onPress={() => router.push(live ? `/card/${live.id}` : `/catalog/${cid}`)} className="w-[31%]">
              <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
              {live ? (
                <View className="absolute left-1 top-1 rounded bg-wink-mint px-1">
                  <Text className="text-white" style={{ fontSize: 9 }}>
                    ${live.price.toFixed(0)}
                  </Text>
                </View>
              ) : null}
              <Text className="text-wink-ink" style={{ fontSize: 9 }} numberOfLines={2}>
                {c.memberName} · {c.era} {c.type}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {wishlist.descriptions.map((d) => (
        <Text key={d} className="mt-2 text-sm text-wink-ink">
          📝 {d}
        </Text>
      ))}

      <SectionTitle title={`Who has these cards (${holders.length})`} />
      {holders.length === 0 ? <Text className="text-sm text-wink-muted">Nobody is listing these yet — we&apos;ll alert you.</Text> : null}
      {holders.map((h) => (
        <UserRow
          key={h.username}
          username={h.username}
          right={<Button size="sm" title={`${h.cards.length} card${h.cards.length > 1 ? "s" : ""}`} onPress={() => router.push(h.cards[0].intent === "sale" ? `/card/${h.cards[0].id}` : `/trade/new?listingId=${h.cards[0].id}`)} />}
        />
      ))}

      <View className="mt-6">
        <Button title="Delete wishlist" variant="ghost" fullWidth onPress={() => { remove(wishlist.id); router.back(); }} />
      </View>

      <CatalogPicker
        visible={picker}
        title="Add or remove cards"
        cta="Save"
        initialGroupId={wishlist.groupId}
        initialSelected={wishlist.cardIds}
        onClose={() => setPicker(false)}
        onDone={(ids) => {
          update(wishlist.id, { cardIds: ids });
          setPicker(false);
        }}
      />
    </Page>
  );
}
