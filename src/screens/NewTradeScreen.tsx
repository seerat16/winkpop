import { useMemo, useState } from "react";
import { Pressable, View } from "@/rn";
import { useLocalSearchParams, useRouter } from "@/rn/router";
import { CheckCircle2 } from "lucide-react";
import { Button, Card, Chip, EmptyState, Field, Notice, Page, PhotocardImage, SectionTitle, Text } from "@/components";
import { catalogIdForListing, getCatalogCard, getPhotocard, TRADE_RATIOS, type Photocard, type TradeRatio, type UserListing } from "@/data";
import { getAnyListing, listingName, useAppStore } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Request a trade from a listing (§9H, §9M, §9X–Z): confirm you have a card the
 * seller wants, see only your cards that match, pick what to offer, choose a
 * ratio / cash top-up, confirm, then jump to your trades.
 */
export default function NewTradeScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const listing = getAnyListing(listingId ?? "") as (Photocard & Partial<UserListing>) | undefined;
  const user = useUserStore((s) => s.user);
  const wishlists = useAppStore((s) => s.wishlists);
  const requestTrade = useAppStore((s) => s.requestTrade);
  const [picked, setPicked] = useState<string[]>([]);
  const [ratio, setRatio] = useState<TradeRatio>(listing?.tradePref?.ratio ?? "1:1");
  const [topUp, setTopUp] = useState("");
  const [confirmedHave, setConfirmedHave] = useState(false);
  const [done, setDone] = useState(false);

  const wanted = useMemo(() => {
    if (!listing) return null;
    const pref = listing.tradePref;
    if (pref?.lockCardId) return new Set([pref.lockCardId]);
    if (pref?.mode === "specific") return new Set(pref.cardIds);
    return null; // seller accepts anything from their wishlist — we can't see it, so match by group
  }, [listing]);

  const mine = (user?.collectionIds ?? []).map(getPhotocard).filter((c): c is Photocard => Boolean(c));
  const matching = mine.filter((c) => (wanted ? wanted.has(catalogIdForListing(c)) : c.groupId === listing?.groupId));

  if (!listing) return <Page title="Trade">{<EmptyState title="Listing not found" />}</Page>;
  const wishlistMatch = wishlists.some((w) => w.cardIds.includes(listing.catalogId ?? catalogIdForListing(listing)));
  const maxPick = ratio === "n:1" ? 5 : 1;

  if (done) {
    return (
      <Page title="Trade requested">
        <View className="items-center py-10">
          <CheckCircle2 size={56} color={colors.mint} />
          <Text className="mt-3 font-display text-xl text-wink-ink">Trade request sent!</Text>
          <Text className="mt-1 text-center text-sm text-wink-muted">@{listing.sellerUsername} will get a notification. You&apos;ll see it under Trading → Outgoing.</Text>
        </View>
        <Button title="Go to my trades" fullWidth onPress={() => router.replace("/(tabs)/transactions?tab=trading")} />
      </Page>
    );
  }

  return (
    <Page
      title="Request a trade"
      footer={
        <Button
          title={`Send trade request${picked.length ? ` (${picked.length})` : ""}`}
          fullWidth
          disabled={!picked.length || (wanted !== null && !confirmedHave)}
          onPress={() => {
            requestTrade({
              partner: listing.sellerUsername,
              myCardIds: picked,
              theirCardIds: [listing.id],
              topUp: ratio === "1:1 + top-up" ? Number(topUp) || 0 : 0,
              ratio,
              wishlistMatch,
            });
            setDone(true);
          }}
        />
      }
    >
      <Card className="flex-row items-center gap-3">
        <View className="w-14">
          <PhotocardImage groupId={listing.groupId} memberName={listing.memberName} imgSeed={listing.imgSeed} />
        </View>
        <View className="flex-1">
          <Text className="font-display text-wink-ink">{listingName(listing)}</Text>
          <Text className="text-xs text-wink-muted">@{listing.sellerUsername}</Text>
        </View>
      </Card>

      {wanted ? (
        <>
          <SectionTitle title="The seller will trade for" />
          {[...wanted].map((id) => (
            <Text key={id} className="text-sm text-wink-ink">
              • {getCatalogCard(id)?.name}
            </Text>
          ))}
          <Pressable onPress={() => setConfirmedHave(!confirmedHave)} className="mt-2 flex-row items-center gap-2">
            <View className="h-5 w-5 items-center justify-center rounded border border-wink-pink" style={{ backgroundColor: confirmedHave ? colors.pink : "white" }}>
              {confirmedHave ? <Text className="text-white" style={{ fontSize: 12 }}>✓</Text> : null}
            </View>
            <Text className="text-sm text-wink-ink">I have one of these cards</Text>
          </Pressable>
        </>
      ) : (
        <Notice text="This seller trades for cards on their wishlist. Showing your cards from the same group." />
      )}

      <SectionTitle title="Ratio" />
      <View className="flex-row flex-wrap gap-2">
        {TRADE_RATIOS.map((r) => (
          <Chip key={r} label={r} active={ratio === r} onPress={() => { setRatio(r); setPicked([]); }} />
        ))}
      </View>
      {ratio === "1:1 + top-up" ? <Field label="Cash top-up ($)" keyboardType="decimal-pad" value={topUp} onChangeText={setTopUp} /> : null}

      <SectionTitle title={`Your matching cards (${matching.length})`} />
      {matching.length === 0 ? (
        <EmptyState emoji="🃏" title="No matching cards in your collection" subtitle="Add cards to your collection to trade them." />
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {matching.map((c) => {
            const on = picked.includes(c.id);
            return (
              <Pressable
                key={c.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => setPicked((p) => (on ? p.filter((x) => x !== c.id) : maxPick === 1 ? [c.id] : [...p, c.id].slice(0, maxPick)))}
                className="w-[31%] rounded-card p-1"
                style={{ borderWidth: 2, borderColor: on ? colors.pink : "transparent" }}
              >
                <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
                <Text className="mt-1 text-wink-ink" style={{ fontSize: 10 }} numberOfLines={1}>
                  {c.memberName} · {c.era}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Page>
  );
}
