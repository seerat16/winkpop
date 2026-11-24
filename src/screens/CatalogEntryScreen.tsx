import { useState } from "react";
import { Pressable, View } from "@/rn";
import { useLocalSearchParams, useRouter } from "@/rn/router";
import { Camera } from "lucide-react";
import { Button, Card, Chip, EmptyState, intentLabel, Notice, Page, PhotocardImage, Pill, SectionTitle, Text } from "@/components";
import { getCatalogCard, getRecentSales, listingsForCatalog, suggestPriceForCatalog } from "@/data";
import { allListings, useAppStore } from "@/data/appStore";
import { colors } from "@/theme/colors";

const MARKS = ["WTT", "WTS", "WTB", "On the way"] as const;

/**
 * Photocard database entry (§3R–W): group, member, era, type, description,
 * category, version; mark WTT/WTS/WTB/On the way; add to a wishlist; recent
 * transactions by country; active sellers/traders; "List this card".
 */
export default function CatalogEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const card = getCatalogCard(id ?? "");
  const mark = useAppStore((s) => s.catalogMarks[id ?? ""]);
  const markCatalog = useAppStore((s) => s.markCatalog);
  const wishlists = useAppStore((s) => s.wishlists);
  const updateWishlist = useAppStore((s) => s.updateWishlist);
  const createWishlist = useAppStore((s) => s.createWishlist);
  const submit = useAppStore((s) => s.submitToDatabase);
  const [added, setAdded] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(0);

  if (!card) return <Page title="Database">{<EmptyState title="Card not found in the database" />}</Page>;

  const listings = listingsForCatalog(card.id, allListings());
  const sales = listings[0] ? getRecentSales(listings[0].id) : [];
  const price = suggestPriceForCatalog(card.id);
  const groupLists = wishlists.filter((w) => w.groupId === card.groupId);

  const addToWishlist = (wlId?: string) => {
    if (wlId) {
      const w = wishlists.find((x) => x.id === wlId)!;
      if (!w.cardIds.includes(card.id)) updateWishlist(wlId, { cardIds: [...w.cardIds, card.id] });
      setAdded(w.name);
    } else {
      createWishlist({
        name: `${card.groupName} wishlist`,
        groupId: card.groupId,
        cardIds: [card.id],
        descriptions: [],
        priority: false,
        level: "medium",
        showOnProfile: false,
      });
      setAdded(`${card.groupName} wishlist`);
    }
  };

  return (
    <Page title="Database entry">
      <View className="items-center">
        <View className="w-1/2">
          <PhotocardImage groupId={card.groupId} memberName={card.memberName} imgSeed={card.imgSeed} />
        </View>
      </View>
      <Text className="mt-4 font-display text-lg text-wink-ink">{card.name}</Text>
      <Card className="mt-3">
        {[
          ["Group", card.groupName],
          ["Member", card.memberName],
          ["Era", card.era],
          ["Type", card.type],
          ["Category", card.category],
          [card.category === "Pre-order Benefit" ? "Store" : "Version", card.version],
          ["Region", card.region],
        ].map(([k, v]) => (
          <View key={k} className="flex-row justify-between py-1">
            <Text className="text-sm text-wink-muted">{k}</Text>
            <Text className="text-sm text-wink-ink">{v}</Text>
          </View>
        ))}
        <Text className="mt-2 text-sm text-wink-ink">{card.description}</Text>
        <View className="mt-2 flex-row flex-wrap gap-1">
          {Object.entries(card.attributes).map(([k, v]) => (
            <Pill key={k} label={`${k}: ${v}`} />
          ))}
        </View>
      </Card>

      <SectionTitle title="Mark this card" />
      <View className="flex-row flex-wrap gap-2">
        {MARKS.map((m) => (
          <Chip key={m} label={m} active={mark === m} onPress={() => markCatalog(card.id, mark === m ? null : m)} />
        ))}
      </View>

      <SectionTitle title="Add to wishlist" />
      <View className="flex-row flex-wrap gap-2">
        {groupLists.map((w) => (
          <Chip key={w.id} label={w.name} active={w.cardIds.includes(card.id)} onPress={() => addToWishlist(w.id)} />
        ))}
        <Chip label="+ New wishlist" onPress={() => addToWishlist()} />
      </View>
      {added ? <Notice tone="success" text={`Added to “${added}”. We'll alert you when it's listed.`} /> : null}

      {price ? (
        <>
          <SectionTitle title="Market price" />
          <Card>
            <Text className="text-sm text-wink-ink">
              Suggested <Text className="font-display text-wink-pink">${price.suggested.toFixed(2)}</Text> · last sold ${price.lastSold.toFixed(2)} · range ${price.low.toFixed(0)}–${price.high.toFixed(0)}
            </Text>
          </Card>
        </>
      ) : null}

      <SectionTitle title="Recent transactions" />
      {sales.length ? (
        sales.map((s, i) => (
          <View key={i} className="flex-row justify-between border-b border-wink-pink-border py-2">
            <Text className="text-xs text-wink-muted">{s.date}</Text>
            <Text className="text-xs text-wink-muted">{s.country}</Text>
            <Text className="text-xs text-wink-ink">${s.price.toFixed(2)}</Text>
          </View>
        ))
      ) : (
        <Text className="text-xs text-wink-muted">No recorded sales yet.</Text>
      )}

      <SectionTitle title={`Active sellers & traders (${listings.length})`} />
      {listings.map((l) => (
        <Pressable key={l.id} onPress={() => router.push(`/card/${l.id}`)} className="flex-row items-center justify-between border-b border-wink-pink-border py-2">
          <Text className="text-sm text-wink-ink">@{l.sellerUsername}</Text>
          <Pill label={intentLabel(l.intent)} />
          <Text className="text-sm text-wink-ink">{l.intent === "trade" ? "Trade" : `$${l.price.toFixed(2)}`}</Text>
        </Pressable>
      ))}

      <View className="mt-5 gap-2">
        <Button title="List this card" fullWidth onPress={() => router.push(`/listing/new?catalogId=${card.id}`)} />
        <Button
          title={submitted ? `Thanks! +${submitted} points` : "Submit a better scan of this card"}
          variant="secondary"
          fullWidth
          icon={<Camera size={16} color={colors.ink} />}
          disabled={submitted > 0}
          onPress={() =>
            setSubmitted(
              submit({ kind: "image_update", groupName: card.groupName, memberName: card.memberName, era: card.era, description: `Updated scan for ${card.name}` }),
            )
          }
        />
      </View>
    </Page>
  );
}
