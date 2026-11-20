import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, Image as ImageIcon, Minus, Plus, Tag, X } from "lucide-react-native";
import {
  Button,
  CatalogPicker,
  Chip,
  Field,
  MenuItem,
  Notice,
  Page,
  PhotocardImage,
  Pill,
  SectionTitle,
  Sheet,
  Text,
  Toggle,
} from "@/components";
import {
  catalogIdForListing,
  extractHashtags,
  getCatalogCard,
  hasShippingSetup,
  MIN_SALE_PRICE,
  offeredShipping,
  PRICE_INCREMENT,
  roundToIncrement,
  sellerEarnings,
  suggestPriceForCatalog,
  TRADE_RATIOS,
  validateListing,
  type Condition,
  type ListingIntent,
  type ShippingMethod,
  type TradeRatio,
  type UserListing,
} from "@/data";
import { getAnyListing, useAppStore, type ListingDraft } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

interface ItemDraft {
  num: number;
  catalogId?: string;
  price: string;
  condition: Condition;
  caption: string;
}
interface PhotoDraft {
  id: string;
  seed: number;
  items: ItemDraft[];
}

type PickerTarget = { kind: "main" } | { kind: "trade" } | { kind: "lock" } | { kind: "item"; photo: number; item: number };

/**
 * Upload / edit a listing (§6). Photos by camera or gallery, database tagging
 * that auto-fills the title, condition + damaged flag, sale / trade / both,
 * $0.05 price steps with suggested & last-sold prices, smart pricing, fee and
 * earnings, trade preferences (wishlist / specific / lock / ratio), shipping
 * options, bundles, and bulk mode where each numbered card in each photo
 * becomes its own listing.
 */
export default function ListingFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ edit?: string; catalogId?: string; fromCollection?: string }>();
  const user = useUserStore((s) => s.user);
  const listings = useAppStore((s) => s.listings);
  const createListings = useAppStore((s) => s.createListings);
  const updateListing = useAppStore((s) => s.updateListing);
  const deleteListing = useAppStore((s) => s.deleteListing);
  const setListingStatus = useAppStore((s) => s.setListingStatus);
  const setPromoted = useAppStore((s) => s.setPromoted);

  const editing = params.edit ? listings.find((l) => l.id === params.edit) : undefined;
  const fromCollection = params.fromCollection ? getAnyListing(params.fromCollection) : undefined;
  const initialCatalog = editing?.catalogId ?? params.catalogId ?? (fromCollection ? catalogIdForListing(fromCollection) : undefined);
  const initialCat = initialCatalog ? getCatalogCard(initialCatalog) : undefined;

  const [photos, setPhotos] = useState<PhotoDraft[]>(
    editing
      ? editing.slides.map((s) => ({
          id: s.id,
          seed: s.imgSeed,
          items: [{ num: 1, catalogId: s.catalogId, price: String(s.price ?? editing.price), condition: s.condition ?? editing.condition, caption: s.caption ?? "" }],
        }))
      : fromCollection
        ? [{ id: "p0", seed: fromCollection.imgSeed, items: [] }]
        : [],
  );
  const [catalogId, setCatalogId] = useState<string | undefined>(initialCatalog);
  const [title, setTitle] = useState(editing?.title ?? initialCat?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [hashtag, setHashtag] = useState(editing?.hashtags.map((h) => `#${h}`).join(" ") ?? "");
  const [condition, setCondition] = useState<Condition>(editing?.condition === "Damaged" ? "Good" : (editing?.condition ?? "Mint"));
  const [damaged, setDamaged] = useState(editing?.damaged ?? false);
  const [intent, setIntent] = useState<ListingIntent>(editing?.intent ?? "sale");
  const [price, setPrice] = useState(editing ? editing.price : (initialCatalog ? (suggestPriceForCatalog(initialCatalog)?.suggested ?? 5) : 5));
  const [smartPricing, setSmartPricing] = useState(editing?.smartPricing ?? false);
  const [tradeMode, setTradeMode] = useState<"wishlist" | "specific">(editing?.tradePref?.mode ?? "wishlist");
  const [tradeCards, setTradeCards] = useState<string[]>(editing?.tradePref?.cardIds ?? []);
  const [lockCard, setLockCard] = useState<string | undefined>(editing?.tradePref?.lockCardId);
  const [ratio, setRatio] = useState<TradeRatio>(editing?.tradePref?.ratio ?? "1:1");
  const offered = offeredShipping(user?.shipping);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(editing?.shippingMethods ?? offered.map((o) => o.method));
  const [freeShipping, setFreeShipping] = useState(editing?.freeShipping ?? user?.shipping?.freeShipping ?? false);
  const [bundle, setBundle] = useState(editing?.bundle ?? false);
  const [bulk, setBulk] = useState(false);
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [error, setError] = useState("");
  const [published, setPublished] = useState<number | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [manageOpen, setManageOpen] = useState(false);

  const suggestion = catalogId ? suggestPriceForCatalog(catalogId) : null;
  const { fee, earnings } = sellerEarnings(price);
  const cat = catalogId ? getCatalogCard(catalogId) : undefined;
  const bulkItems = useMemo(() => photos.flatMap((p, pi) => p.items.map((it, ii) => ({ ...it, pi, ii, seed: p.seed }))), [photos]);

  const addPhoto = (source: "camera" | "gallery") => {
    if (photos.length >= 10) return;
    const seed = Math.floor(Math.random() * 9000) + 1000;
    setPhotos((p) => [...p, { id: `ph-${Date.now()}-${p.length}`, seed, items: [] }]);
    setPhotoIdx(photos.length);
    // Camera / gallery capture is simulated until expo-image-picker is added.
    void source;
  };

  const onPick = (ids: string[]) => {
    if (!picker) return;
    if (picker.kind === "main") {
      const c = getCatalogCard(ids[0]);
      setCatalogId(ids[0]);
      if (c) {
        setTitle(c.name);
        const s = suggestPriceForCatalog(c.id);
        if (s && !editing) setPrice(s.suggested);
      }
    } else if (picker.kind === "trade") setTradeCards((t) => [...new Set([...t, ...ids])]);
    else if (picker.kind === "lock") setLockCard(ids[0]);
    else {
      const { photo, item } = picker;
      setPhotos((ps) =>
        ps.map((p, pi) => {
          if (pi !== photo) return p;
          const items = [...p.items];
          const s = suggestPriceForCatalog(ids[0]);
          if (item >= items.length) items.push({ num: items.length + 1, catalogId: ids[0], price: String(s?.suggested ?? 5), condition: "Mint", caption: "" });
          else items[item] = { ...items[item], catalogId: ids[0] };
          return { ...p, items };
        }),
      );
    }
    setPicker(null);
  };

  const updateItem = (pi: number, ii: number, patch: Partial<ItemDraft>) =>
    setPhotos((ps) => ps.map((p, x) => (x !== pi ? p : { ...p, items: p.items.map((it, y) => (y === ii ? { ...it, ...patch } : it)) })));
  const removeItem = (pi: number, ii: number) =>
    setPhotos((ps) => ps.map((p, x) => (x !== pi ? p : { ...p, items: p.items.filter((_, y) => y !== ii).map((it, y) => ({ ...it, num: y + 1 })) })));
  const movePhoto = (i: number, d: -1 | 1) =>
    setPhotos((ps) => {
      const j = i + d;
      if (j < 0 || j >= ps.length) return ps;
      const n = [...ps];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const baseDraft = (overrides: Partial<ListingDraft> = {}): ListingDraft => {
    const c = getCatalogCard(overrides.catalogId ?? catalogId ?? "") ?? cat;
    return {
      catalogId: c?.id,
      groupId: c?.groupId ?? fromCollection?.groupId ?? "newjeans",
      groupName: c?.groupName ?? fromCollection?.groupName ?? "",
      memberId: c?.memberId ?? fromCollection?.memberId ?? "",
      memberName: c?.memberName ?? fromCollection?.memberName ?? "",
      era: c?.era ?? fromCollection?.era ?? "",
      type: c?.type ?? fromCollection?.type ?? "Album",
      title: title.trim(),
      description: description.trim(),
      hashtags: extractHashtags(hashtag.includes("#") ? hashtag : hashtag.split(/\s+/).filter(Boolean).map((h) => `#${h}`).join(" ")),
      condition: damaged ? "Damaged" : condition,
      damaged,
      intent,
      price: intent === "trade" ? 0 : price,
      slides: photos.map((p) => ({ id: p.id, imgSeed: p.seed, catalogId: p.items[0]?.catalogId, price: p.items[0] ? Number(p.items[0].price) : undefined, caption: p.items[0]?.caption, condition: p.items[0]?.condition })),
      tradePref: intent === "sale" ? undefined : { mode: tradeMode, cardIds: tradeCards, lockCardId: lockCard, ratio },
      shippingMethods,
      freeShipping,
      smartPricing,
      bundle,
      imgSeed: photos[0]?.seed,
      ...overrides,
    };
  };

  const publish = () => {
    setError("");
    if (!hasShippingSetup(user?.shipping)) return setError("Set up your shipping options first (Profile → truck icon).");
    if (bulk) {
      if (bulkItems.length === 0) return setError("Tag at least one numbered card in your photos.");
      const drafts: ListingDraft[] = [];
      for (const it of bulkItems) {
        const c = getCatalogCard(it.catalogId ?? "");
        const p = roundToIncrement(Number(it.price));
        const err = validateListing({ title: c?.name ?? "", intent, price: p, tradeMode, tradeCardCount: tradeCards.length });
        if (err) return setError(`Card #${it.num} on photo ${it.pi + 1}: ${err}`);
        drafts.push(
          baseDraft({
            catalogId: c?.id,
            title: c?.name ?? title,
            description: it.caption || description,
            price: intent === "trade" ? 0 : p,
            condition: it.condition,
            damaged: it.condition === "Damaged",
            slides: [{ id: `${it.pi}-${it.num}`, imgSeed: it.seed, catalogId: c?.id }],
            imgSeed: it.seed,
          }),
        );
      }
      createListings(drafts);
      setPublished(drafts.length);
      return;
    }
    const err = validateListing({ title, intent, price, tradeMode, tradeCardCount: tradeCards.length });
    if (err) return setError(err);
    if (editing) {
      updateListing(editing.id, { ...baseDraft(), available: editing.status === "active" });
      router.back();
      return;
    }
    createListings([baseDraft()]);
    setPublished(1);
  };

  if (published) {
    return (
      <Page title="Card listed!">
        <View className="items-center py-10">
          <CheckCircle2 size={56} color={colors.mint} />
          <Text className="mt-3 font-display text-xl text-wink-ink">{published > 1 ? `${published} cards listed!` : "Card listed!"}</Text>
          <Text className="mt-1 text-center text-sm text-wink-muted">Collectors with this card on their wishlist will be notified.</Text>
        </View>
        <Button title="Go to profile" fullWidth onPress={() => router.replace("/(tabs)/profile")} />
      </Page>
    );
  }

  return (
    <Page
      title={editing ? "Edit listing" : "Upload listing"}
      right={editing ? <Pressable onPress={() => setManageOpen(true)}><Text className="text-sm text-wink-pink">Manage</Text></Pressable> : null}
      footer={
        <>
          {error ? <Text className="mb-2 text-center text-sm text-wink-pink">{error}</Text> : null}
          <Button title={editing ? "Save Changes" : bulk ? `Publish ${bulkItems.length || ""} listings` : "Publish Listing"} fullWidth onPress={publish} />
          {editing ? (
            <Button
              title="Delete Listing"
              variant="ghost"
              fullWidth
              onPress={() => {
                deleteListing(editing.id);
                router.replace("/(tabs)/profile");
              }}
            />
          ) : null}
        </>
      }
    >
      {/* photos */}
      <View className="mb-2 flex-row gap-2">
        <View className="flex-1">
          <Button title="Camera" variant="secondary" fullWidth icon={<Camera size={16} color={colors.ink} />} onPress={() => addPhoto("camera")} />
        </View>
        <View className="flex-1">
          <Button title="Gallery" variant="secondary" fullWidth icon={<ImageIcon size={16} color={colors.ink} />} onPress={() => addPhoto("gallery")} />
        </View>
      </View>
      {photos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            {photos.map((p, i) => (
              <Pressable key={p.id} onPress={() => setPhotoIdx(i)} className="w-20" style={{ opacity: i === photoIdx ? 1 : 0.7 }}>
                <PhotocardImage groupId={cat?.groupId ?? "ive"} memberName={`${i + 1}`} imgSeed={p.seed} />
                <Pressable
                  accessibilityLabel={`Remove photo ${i + 1}`}
                  onPress={() => setPhotos((ps) => ps.filter((_, x) => x !== i))}
                  className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-black/60"
                >
                  <X size={12} color={colors.white} />
                </Pressable>
                <View className="mt-1 flex-row justify-between">
                  <Pressable accessibilityLabel="Move left" onPress={() => movePhoto(i, -1)}>
                    <ChevronLeft size={14} color={colors.muted} />
                  </Pressable>
                  <Text className="text-wink-muted" style={{ fontSize: 10 }}>
                    {i + 1}/{photos.length}
                  </Text>
                  <Pressable accessibilityLabel="Move right" onPress={() => movePhoto(i, 1)}>
                    <ChevronRight size={14} color={colors.muted} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text className="mb-2 text-xs text-wink-muted">Add up to 10 photos. Tip: a well-lit photo on a plain background sells faster.</Text>
      )}

      <Toggle
        label="Bulk list: separate listing for each card"
        sub="Tap a photo, tag each card in it with a number, and give each its own price & condition"
        value={bulk}
        onChange={setBulk}
      />

      {bulk ? (
        <>
          {photos.length === 0 ? <Notice text="Add photos first, then tag the cards in each one." /> : null}
          {photos.map((p, pi) => (
            <View key={p.id} className="mb-3 rounded-card border border-wink-pink-border bg-white p-3">
              <Text className="mb-2 font-display text-wink-ink">Photo {pi + 1}</Text>
              {p.items.map((it, ii) => {
                const c = getCatalogCard(it.catalogId ?? "");
                return (
                  <View key={ii} className="mb-2 rounded-card bg-wink-purple-tint p-2">
                    <View className="flex-row items-center gap-2">
                      <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-wink-pink bg-white">
                        <Text className="font-display text-wink-pink" style={{ fontSize: 11 }}>
                          {it.num}
                        </Text>
                      </View>
                      <Pressable className="flex-1" onPress={() => setPicker({ kind: "item", photo: pi, item: ii })}>
                        <Text className="text-xs text-wink-ink" numberOfLines={1}>
                          {c?.name ?? "Tag database card"}
                        </Text>
                      </Pressable>
                      <Pressable accessibilityLabel={`Remove card ${it.num}`} onPress={() => removeItem(pi, ii)}>
                        <X size={14} color={colors.muted} />
                      </Pressable>
                    </View>
                    <View className="mt-2 flex-row gap-2">
                      <View className="w-24">
                        <Field label="Price $" keyboardType="decimal-pad" value={it.price} onChangeText={(t) => updateItem(pi, ii, { price: t })} />
                      </View>
                      <View className="flex-1">
                        <Field label="Caption" value={it.caption} onChangeText={(t) => updateItem(pi, ii, { caption: t })} />
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      {(["Mint", "Good", "Damaged"] as Condition[]).map((cnd) => (
                        <Chip key={cnd} label={cnd === "Mint" ? "Like New" : cnd === "Good" ? "Used" : "Damaged"} active={it.condition === cnd} onPress={() => updateItem(pi, ii, { condition: cnd })} />
                      ))}
                    </View>
                  </View>
                );
              })}
              <Button size="sm" variant="secondary" title={`+ Tag card #${p.items.length + 1}`} onPress={() => setPicker({ kind: "item", photo: pi, item: p.items.length })} />
            </View>
          ))}
          {bulkItems.length ? (
            <>
              <SectionTitle title={`Listings to create (${bulkItems.length})`} />
              {bulkItems.map((it) => (
                <Text key={`${it.pi}-${it.num}`} className="text-xs text-wink-ink">
                  Photo {it.pi + 1} · #{it.num} · {getCatalogCard(it.catalogId ?? "")?.name ?? "untagged"} · ${Number(it.price || 0).toFixed(2)} · {it.condition}
                </Text>
              ))}
            </>
          ) : null}
        </>
      ) : (
        <>
          {/* database tag */}
          <SectionTitle title="Photocard type" />
          <Pressable
            accessibilityLabel="Pick photocard type"
            onPress={() => setPicker({ kind: "main" })}
            className="flex-row items-center gap-2 rounded-card border border-wink-pink-border bg-white p-3"
          >
            <Tag size={16} color={colors.pink} />
            <Text className="flex-1 text-sm text-wink-ink" numberOfLines={2}>
              {cat ? cat.name : "Pick the card from the database (auto-fills the title)"}
            </Text>
          </Pressable>
          {cat ? (
            <View className="mt-1 flex-row flex-wrap gap-1">
              {[cat.groupName, cat.memberName, cat.era, cat.type, cat.category].map((t) => (
                <Pill key={t} label={t} />
              ))}
            </View>
          ) : null}
          {photos.length > 1 ? (
            <>
              <SectionTitle title="Per-slide details" />
              {photos.map((p, i) => (
                <View key={p.id} className="mb-2 flex-row items-center gap-2">
                  <Text className="w-14 text-xs text-wink-muted">Slide {i + 1}</Text>
                  <Pressable className="flex-1" onPress={() => setPicker({ kind: "item", photo: i, item: 0 })}>
                    <Text className="text-xs text-wink-ink" numberOfLines={1}>
                      {getCatalogCard(p.items[0]?.catalogId ?? "")?.name ?? "Tag card for this slide"}
                    </Text>
                  </Pressable>
                  {p.items[0] ? (
                    <View className="w-20">
                      <Field keyboardType="decimal-pad" value={p.items[0].price} onChangeText={(t) => updateItem(i, 0, { price: t })} />
                    </View>
                  ) : null}
                </View>
              ))}
            </>
          ) : null}
        </>
      )}

      <SectionTitle title="Details" />
      {!bulk ? <Field label="Title" value={title} onChangeText={setTitle} placeholder="Group Member · Era Type" /> : null}
      <Field label="Description (optional)" multiline value={description} onChangeText={setDescription} placeholder="Any flaws, sleeve/toploader, proofs…" />
      <Field label="Hashtags" value={hashtag} onChangeText={setHashtag} placeholder="#newjeans #hanni" hint="Hashtags are saved so collectors can search them." />
      <Notice text="Tip: detailed descriptions sell better. Never include personal info like your address or phone number." />

      <SectionTitle title="Condition" />
      <View className="flex-row gap-2">
        <Chip label="Like New — no scratches or marks" active={condition === "Mint"} onPress={() => setCondition("Mint")} />
        <Chip label="Used — scratches or marks" active={condition !== "Mint"} onPress={() => setCondition("Good")} />
      </View>
      <Toggle label="Flag as Damaged" sub="Shown on the listing so buyers know up front" value={damaged} onChange={setDamaged} />

      <SectionTitle title="Listing type" />
      <View className="flex-row gap-2">
        <Chip label="For sale" active={intent === "sale"} onPress={() => setIntent("sale")} />
        <Chip label="For trade" active={intent === "trade"} onPress={() => setIntent("trade")} />
        <Chip label="Sale & trade" active={intent === "both"} onPress={() => setIntent("both")} />
      </View>

      {intent !== "trade" && !bulk ? (
        <>
          <SectionTitle title="Price" />
          <View className="flex-row items-center gap-3">
            <Pressable accessibilityLabel="Decrease price" onPress={() => setPrice((p) => Math.max(MIN_SALE_PRICE, roundToIncrement(p - PRICE_INCREMENT)))} className="h-11 w-11 items-center justify-center rounded-card border border-wink-pink-border bg-white">
              <Minus size={18} color={colors.ink} />
            </Pressable>
            <View className="flex-1">
              <Field
                keyboardType="decimal-pad"
                value={String(price)}
                onChangeText={(t) => setPrice(Number(t.replace(/[^0-9.]/g, "")) || 0)}
                accessibilityLabel="Price"
              />
            </View>
            <Pressable accessibilityLabel="Increase price" onPress={() => setPrice((p) => roundToIncrement(p + PRICE_INCREMENT))} className="h-11 w-11 items-center justify-center rounded-card border border-wink-pink-border bg-white">
              <Plus size={18} color={colors.ink} />
            </Pressable>
          </View>
          <Text className="-mt-1 text-xs text-wink-muted">Must be at least ${MIN_SALE_PRICE.toFixed(2)}, in $0.05 steps.</Text>
          {suggestion ? (
            <View className="mt-2 flex-row items-center justify-between rounded-card bg-wink-mint-tint px-3 py-2">
              <Text className="text-xs" style={{ color: "#2E8B6E" }}>
                Suggested ${suggestion.suggested.toFixed(2)} · Last sold ${suggestion.lastSold.toFixed(2)}
              </Text>
              <Pressable onPress={() => setPrice(suggestion.suggested)}>
                <Text className="font-display text-xs" style={{ color: "#2E8B6E" }}>
                  Use suggested
                </Text>
              </Pressable>
            </View>
          ) : null}
          <Toggle label="Smart pricing" sub="Auto-adjust toward recent sold prices if it doesn't sell" value={smartPricing} onChange={setSmartPricing} />
          <View className="rounded-card bg-white p-3">
            <Row label="Price" value={`$${price.toFixed(2)}`} />
            <Row label="Selling fee" value={`$${fee.toFixed(2)} (WinKPop charges no seller fees)`} />
            <Row label="You earn" value={`$${earnings.toFixed(2)}`} bold />
          </View>
        </>
      ) : null}

      {intent !== "sale" ? (
        <>
          <SectionTitle title="Trade for" />
          <View className="flex-row gap-2">
            <Chip label="Anything on my wishlist / likes" active={tradeMode === "wishlist"} onPress={() => setTradeMode("wishlist")} />
            <Chip label="Specific cards" active={tradeMode === "specific"} onPress={() => setTradeMode("specific")} />
          </View>
          {tradeMode === "wishlist" ? (
            <Text className="mt-2 text-xs text-wink-muted">Your wishlist cards are added automatically and stay in sync as it changes.</Text>
          ) : (
            <View className="mt-2 flex-row flex-wrap gap-2">
              {tradeCards.map((id) => (
                <View key={id} className="flex-row items-center gap-1 rounded-pill bg-white px-3 py-1.5">
                  <Text className="text-xs text-wink-ink" numberOfLines={1} style={{ maxWidth: 180 }}>
                    {getCatalogCard(id)?.name}
                  </Text>
                  <Pressable accessibilityLabel="Remove trade card" onPress={() => setTradeCards((t) => t.filter((x) => x !== id))}>
                    <X size={12} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
              <Chip label="+ Add cards" onPress={() => setPicker({ kind: "trade" })} />
            </View>
          )}
          <View className="mt-3 flex-row items-center gap-2">
            <Text className="text-sm text-wink-ink">Lock to one card:</Text>
            <Pressable className="flex-1" onPress={() => setPicker({ kind: "lock" })}>
              <Text className="text-xs text-wink-pink" numberOfLines={1}>
                {lockCard ? getCatalogCard(lockCard)?.name : "None — tap to choose"}
              </Text>
            </Pressable>
            {lockCard ? (
              <Pressable accessibilityLabel="Remove lock" onPress={() => setLockCard(undefined)}>
                <X size={14} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          {lockCard ? <Text className="text-xs text-wink-muted">Only collectors who own that card can see and request this trade.</Text> : null}
          <Text className="mb-2 mt-3 text-sm text-wink-ink">Trade ratio</Text>
          <View className="flex-row flex-wrap gap-2">
            {TRADE_RATIOS.map((r) => (
              <Chip key={r} label={r} active={ratio === r} onPress={() => setRatio(r)} />
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle title="Shipping" />
      {!hasShippingSetup(user?.shipping) ? (
        <View>
          <Notice tone="error" text="You haven't set up shipping options yet." />
          <Button title="Set up shipping" variant="secondary" onPress={() => router.push("/settings/shipping")} />
        </View>
      ) : (
        <>
          <View className="flex-row flex-wrap gap-2">
            {offered.map((o) => (
              <Chip
                key={o.method}
                label={`${o.label} $${o.price.toFixed(2)}`}
                active={shippingMethods.includes(o.method)}
                onPress={() => setShippingMethods((m) => (m.includes(o.method) ? m.filter((x) => x !== o.method) : [...m, o.method]))}
              />
            ))}
          </View>
          <Toggle label="Offer free shipping" value={freeShipping} onChange={setFreeShipping} />
        </>
      )}
      <Toggle label="Bundle listing" sub="Buyers can buy the whole set or just one item, with bundle discounts" value={bundle} onChange={setBundle} />

      <CatalogPicker
        visible={picker !== null}
        multi={picker?.kind === "trade"}
        title={picker?.kind === "trade" ? "Cards you'd trade for" : picker?.kind === "lock" ? "Lock to one card" : "Photocard type"}
        cta={picker?.kind === "trade" ? "Add to Trade" : "Select"}
        initialGroupId={cat?.groupId ?? user?.collectingGroupIds[0]}
        onClose={() => setPicker(null)}
        onDone={onPick}
      />

      {editing ? <ManageSheet listing={editing} visible={manageOpen} onClose={() => setManageOpen(false)} setStatus={setListingStatus} setPromoted={setPromoted} /> : null}
    </Page>
  );
}

function ManageSheet({
  listing,
  visible,
  onClose,
  setStatus,
  setPromoted,
}: {
  listing: UserListing;
  visible: boolean;
  onClose: () => void;
  setStatus: (ids: string[], s: UserListing["status"]) => void;
  setPromoted: (ids: string[], p: boolean) => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title={`Listing is ${listing.status}`}>
      {listing.status !== "active" ? <MenuItem label={listing.status === "sold" ? "Relist" : "Activate"} onPress={() => { setStatus([listing.id], "active"); onClose(); }} /> : null}
      {listing.status === "active" ? <MenuItem label="Deactivate" onPress={() => { setStatus([listing.id], "inactive"); onClose(); }} /> : null}
      <MenuItem label={listing.status === "hold" ? "Release hold" : "Put on hold"} onPress={() => { setStatus([listing.id], listing.status === "hold" ? "active" : "hold"); onClose(); }} />
      <MenuItem label={listing.promoted ? "Stop promoting" : "Promote (shown first in feeds)"} onPress={() => { setPromoted([listing.id], !listing.promoted); onClose(); }} />
      <MenuItem label="Mark as sold" onPress={() => { setStatus([listing.id], "sold"); onClose(); }} />
    </Sheet>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-0.5">
      <Text className={bold ? "font-display text-wink-ink" : "text-xs text-wink-muted"}>{label}</Text>
      <Text className={bold ? "font-display text-wink-ink" : "text-xs text-wink-ink"}>{value}</Text>
    </View>
  );
}
