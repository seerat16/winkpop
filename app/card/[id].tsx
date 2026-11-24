import { useEffect, useState } from "react";
import { Dimensions, Pressable, ScrollView, Share, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat,
  ShoppingCart,
  TrendingUp,
  Zap,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Avatar,
  Button,
  Card,
  Field,
  HorizontalCards,
  intentLabel,
  MenuItem,
  Notice,
  PhotocardImage,
  Pill,
  ReportSheet,
  SectionTitle,
  Sheet,
  Stars,
  Text,
  timeAgo,
  Verified,
  avatarColorFor,
} from "@/components";
import {
  catalogIdForListing,
  getCatalogCard,
  getCommunityUser,
  getPriceHistory,
  getPriceStats,
  getRecentSales,
  getReviews,
  listingsForCatalog,
  offeredShipping,
  PAYMENT_LABELS,
  roundToIncrement,
  similarListings,
  summarizeReviews,
  type UserListing,
} from "@/data";
import { allListings, getAnyListing, listingName, useAppStore, EMPTY } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";

/**
 * Listing page (§7, §8): photo carousel (seller photo + database image),
 * WTS/WTT label, seller trust info, price intelligence with recent sales by
 * country, buy now / offer / trade, comments, actions menu and similar items.
 */
export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const listings = useAppStore((s) => s.listings);
  const card = listings.find((l) => l.id === id) ?? getAnyListing(id ?? "");

  const user = useUserStore((s) => s.user);
  const toggleLike = useUserStore((s) => s.toggleLike);
  const toggleCart = useUserStore((s) => s.toggleCart);
  const toggleWishlist = useUserStore((s) => s.toggleWishlist);
  const toggleSave = useUserStore((s) => s.toggleSave);
  const addToCollection = useUserStore((s) => s.addToCollection);
  const addRecentlyViewed = useUserStore((s) => s.addRecentlyViewed);
  const makeOffer = useAppStore((s) => s.makeOffer);
  const openConversation = useAppStore((s) => s.openConversation);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const toggleHold = useAppStore((s) => s.toggleHold);
  const heldIds = useAppStore((s) => s.heldIds);
  const comments = useAppStore((s) => s.listingComments[id ?? ""] ?? EMPTY);

  const [slide, setSlide] = useState(0);
  const [revealTag, setRevealTag] = useState(false);
  const [menu, setMenu] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offer, setOffer] = useState("");
  const [offerSent, setOfferSent] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [intentSheet, setIntentSheet] = useState(false);

  useEffect(() => {
    if (card) addRecentlyViewed(card.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id]);

  if (!card) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-wink-purple-tint">
        <Text className="text-wink-muted">Card not found</Text>
      </SafeAreaView>
    );
  }

  const ul = card as Partial<UserListing>;
  const isMine = card.sellerUsername === user?.username;
  const seller = getCommunityUser(card.sellerUsername);
  const reviews = summarizeReviews(getReviews(card.sellerUsername));
  const catalogId = ul.catalogId ?? catalogIdForListing(card);
  const cat = getCatalogCard(catalogId);
  const liked = user?.likesIds.includes(card.id) ?? false;
  const saved = user?.savedIds.includes(card.id) ?? false;
  const inCart = user?.cartIds.includes(card.id) ?? false;
  const wishlisted = user?.wishlistIds.includes(card.id) ?? false;
  const owned = user?.collectionIds.includes(card.id) ?? false;
  const onHold = ul.status === "hold" || heldIds.includes(card.id);
  const likeCount = (ul.stats?.likes ?? Math.round(card.popularity / 40)) + (liked ? 1 : 0);

  const stats = getPriceStats(card.id);
  const history = getPriceHistory(card.id);
  const maxPrice = Math.max(...history.map((h) => h.price), 1);
  const sales = getRecentSales(card.id);
  const shipping = offeredShipping(seller?.shipping ?? user?.shipping);
  const otherSellers = listingsForCatalog(catalogId, allListings()).filter((l) => l.id !== card.id);
  const moreFromSeller = allListings().filter((l) => l.sellerUsername === card.sellerUsername && l.id !== card.id && l.available).slice(0, 8);
  const similar = similarListings(card, allListings());
  const slideCount = Math.max(2, ul.slides?.length ?? 0);
  const listedAt = ul.createdAt ?? new Date(Date.now() - (card.imgSeed % 20) * 86400e3).toISOString();

  const messageSeller = () => {
    const conv = openConversation(card.sellerUsername, "purchase");
    sendMessage(conv, { kind: "listing", refId: card.id });
    sendMessage(conv, { kind: "text", text: "Hi! Is it still available?" });
    router.push(`/chat/${conv}`);
  };

  const submitOffer = () => {
    const amount = roundToIncrement(Number(offer));
    if (!(amount > 0)) return;
    makeOffer(card.id, amount);
    setOfferSent(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-wink-purple-tint" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full bg-white">
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityLabel={liked ? "Unlike listing" : "Like listing"}
            onPress={() => toggleLike(card.id)}
            hitSlop={8}
            className="h-9 flex-row items-center gap-1 rounded-full bg-white px-3"
          >
            <Heart size={16} color={liked ? colors.pink : colors.muted} fill={liked ? colors.pink : "none"} />
            <Text className="text-xs text-wink-ink">{likeCount}</Text>
          </Pressable>
          <Pressable accessibilityLabel="Listing actions" onPress={() => setMenu(true)} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full bg-white">
            <MoreHorizontal size={18} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* photo carousel: seller photo(s) + database image (§7N) */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e: { nativeEvent: { contentOffset: { x: number }; layoutMeasurement: { width: number } } }) =>
            setSlide(Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width))
          }
        >
          {Array.from({ length: slideCount }).map((_, i) => (
            <Pressable key={i} onPress={() => setRevealTag((v) => !v)} accessibilityLabel="Reveal tagged photocard" style={{ width: Dimensions.get("window").width }} className="items-center px-6 pt-2">
              <View className="w-2/3">
                <PhotocardImage
                  groupId={card.groupId}
                  memberName={card.memberName}
                  imgSeed={i === slideCount - 1 ? (cat?.imgSeed ?? card.imgSeed) : (ul.slides?.[i]?.imgSeed ?? card.imgSeed + i)}
                />
                <View className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5">
                  <Text className="text-white" style={{ fontSize: 10 }}>
                    {i === slideCount - 1 ? "Database image" : "Seller photo"}
                  </Text>
                </View>
                {revealTag && cat ? (
                  <Pressable onPress={() => router.push(`/catalog/${cat.id}`)} className="absolute bottom-3 left-3 right-3 rounded-card bg-white/95 p-2">
                    <Text className="text-wink-ink" style={{ fontSize: 11 }}>
                      🏷 {cat.name}
                    </Text>
                    <Text className="text-wink-pink" style={{ fontSize: 10 }}>
                      Open database entry →
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>
        <View className="mt-2 flex-row items-center justify-center gap-1">
          {Array.from({ length: slideCount }).map((_, i) => (
            <View key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: i === slide ? colors.pink : "#ddd" }} />
          ))}
          <Text className="ml-2 text-xs text-wink-muted">
            {slide + 1} / {slideCount}
          </Text>
        </View>

        <View className="px-5 pt-4">
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => router.push(`/group/${card.groupId}`)}>
              <Text className="font-display text-wink-pink">{card.groupName}</Text>
            </Pressable>
            <Pressable onPress={() => setIntentSheet(true)} accessibilityLabel={`${intentLabel(card.intent)} — buy or trade`}>
              <Pill label={intentLabel(card.intent)} color={colors.white} bg={colors.purple} />
            </Pressable>
            {onHold ? <Pill label="On hold" /> : null}
            {card.damaged ? <Pill label="⚠ Damaged" color="#B5532F" bg="#FFF0E8" /> : null}
          </View>
          <Text className="font-display text-xl text-wink-ink">{listingName(card)}</Text>
          <Text className="mt-1 text-sm text-wink-muted">
            {card.type} · {card.condition} · listed {timeAgo(listedAt)} ago
          </Text>

          <View className="mt-3 flex-row items-end gap-2">
            {card.intent !== "trade" ? (
              <Text className="font-display text-3xl text-wink-ink">${card.price.toFixed(2)}</Text>
            ) : (
              <Text className="font-display text-2xl text-wink-purple">Trade only</Text>
            )}
          </View>

          {ul.description ? <Text className="mt-2 text-sm text-wink-ink">{ul.description}</Text> : null}
          <Text className="mt-2 text-xs text-wink-muted">
            Condition: {card.condition === "Mint" ? "Like new — no scratches or marks" : card.condition === "Damaged" ? "Damaged — see photos" : "Used — light scratches or marks"}
          </Text>
          {ul.hashtags?.length ? (
            <Text className="mt-1 text-xs text-wink-purple">{ul.hashtags.map((h) => `#${h}`).join(" ")}</Text>
          ) : null}

          {ul.tradePref && card.intent !== "sale" ? (
            <Card className="mt-3">
              <Text className="font-display text-wink-ink">Will trade for</Text>
              <Text className="text-xs text-wink-muted">
                {ul.tradePref.lockCardId
                  ? `Locked to one card: ${getCatalogCard(ul.tradePref.lockCardId)?.name ?? ""}`
                  : ul.tradePref.mode === "wishlist"
                    ? "Anything on my wishlist (auto-updates)"
                    : ul.tradePref.cardIds.map((c) => getCatalogCard(c)?.name).join(", ")}
                {` · ratio ${ul.tradePref.ratio}`}
              </Text>
            </Card>
          ) : null}

          {/* seller */}
          <Pressable onPress={() => router.push(`/user/${card.sellerUsername}`)} className="mt-4 flex-row items-center gap-3 rounded-card border border-wink-pink-border bg-white p-3">
            <Avatar name={card.sellerUsername} color={avatarColorFor(card.sellerUsername)} size={40} />
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text className="font-display text-wink-ink">@{card.sellerUsername}</Text>
                {seller?.verified ? <Verified /> : null}
              </View>
              <Pressable onPress={() => router.push(`/reviews/${card.sellerUsername}`)} className="flex-row items-center gap-1">
                <Stars value={reviews.average} size={11} />
                <Text className="text-xs text-wink-muted">
                  {reviews.average.toFixed(1)} ({reviews.count}) · {seller?.completedTransactions ?? 0} trades
                </Text>
              </Pressable>
              <Text className="text-xs text-wink-muted">📍 {seller?.location ?? user?.location}</Text>
            </View>
          </Pressable>

          <Card className="mt-3">
            <Text className="mb-1 font-display text-wink-ink">Shipping & payment</Text>
            {shipping.length ? (
              shipping.map((s) => (
                <View key={s.method} className="flex-row justify-between py-0.5">
                  <Text className="text-xs text-wink-ink">{s.label}</Text>
                  <Text className="text-xs text-wink-muted">
                    {s.price === 0 ? "Free" : `$${s.price.toFixed(2)}`} · {s.method.includes("intl") ? "7–21 days" : "2–5 days"}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-xs text-wink-muted">Seller hasn&apos;t set up shipping yet.</Text>
            )}
            <Text className="mt-1 text-xs text-wink-muted">
              Pay with {["wallet", "apple_pay", "paypal", "card"].map((p) => PAYMENT_LABELS[p as keyof typeof PAYMENT_LABELS]).join(", ")} · payment held until delivery
            </Text>
          </Card>

          {/* price intelligence */}
          {stats ? (
            <View className="mt-4 rounded-card border border-wink-pink-border bg-white p-4">
              <Pressable onPress={() => setExpanded((e) => !e)} className="mb-3 flex-row items-center gap-2">
                <TrendingUp size={16} color={colors.mint} />
                <Text className="flex-1 font-display text-wink-ink">Price intelligence</Text>
                {expanded ? <ChevronUp size={16} color={colors.muted} /> : <ChevronDown size={16} color={colors.muted} />}
              </Pressable>
              <View className="mb-3 flex-row justify-between">
                <PriceStat label="Low" value={stats.low} />
                <PriceStat label="Avg" value={stats.avg} highlight />
                <PriceStat label="High" value={stats.high} />
                <PriceStat label="Last" value={stats.last} />
              </View>
              <View className="flex-row items-end gap-0.5" style={{ height: expanded ? 120 : 64 }}>
                {history.map((h, i) => (
                  <View key={i} className="flex-1 rounded-t" style={{ height: `${(h.price / maxPrice) * 100}%`, backgroundColor: colors.purpleSoft }} />
                ))}
              </View>
              {expanded ? (
                <>
                  <View className="mt-1 flex-row justify-between">
                    <Text className="text-wink-muted" style={{ fontSize: 9 }}>
                      {history[0]?.date}
                    </Text>
                    <Text className="text-wink-muted" style={{ fontSize: 9 }}>
                      {history[history.length - 1]?.date}
                    </Text>
                  </View>
                  <Text className="mb-1 mt-3 font-display text-sm text-wink-ink">Recent sales</Text>
                  {sales.map((s, i) => (
                    <View key={i} className="flex-row justify-between py-0.5">
                      <Text className="text-xs text-wink-muted">{s.date}</Text>
                      <Text className="text-xs text-wink-muted">{s.country}</Text>
                      <Text className="text-xs text-wink-ink">${s.price.toFixed(2)}</Text>
                    </View>
                  ))}
                </>
              ) : null}
              <Text className="mt-2 text-xs text-wink-muted">
                Recent sales suggest ${stats.low.toFixed(0)}–${stats.high.toFixed(0)} for this card.
              </Text>
            </View>
          ) : null}

          {/* comments */}
          <SectionTitle title={`Comments (${comments.length})`} action="View all" onAction={() => router.push(`/comments/${card.id}`)} />
          {comments.slice(-2).map((c) => (
            <Text key={c.id} className="mb-1 text-sm text-wink-ink">
              <Text className="font-display">{c.author} </Text>
              {c.text}
            </Text>
          ))}
          {comments.length === 0 ? <Text className="text-xs text-wink-muted">Start the conversation about this listing.</Text> : null}

          {otherSellers.length ? (
            <>
              <SectionTitle title="Others selling / trading this card" />
              {otherSellers.slice(0, 5).map((l) => (
                <Pressable key={l.id} onPress={() => router.push(`/card/${l.id}`)} className="flex-row items-center justify-between border-b border-wink-pink-border py-2">
                  <Text className="text-sm text-wink-ink">@{l.sellerUsername}</Text>
                  <Pill label={intentLabel(l.intent)} />
                  <Text className="text-sm text-wink-ink">${l.price.toFixed(2)}</Text>
                </Pressable>
              ))}
            </>
          ) : null}

          {moreFromSeller.length ? (
            <>
              <SectionTitle title={`More from @${card.sellerUsername} · bundle & save`} />
              <HorizontalCards ids={moreFromSeller.map((c) => c.id)} />
            </>
          ) : null}

          <SectionTitle title="Similar items" />
          <HorizontalCards ids={similar.map((c) => c.id)} />
        </View>
      </ScrollView>

      {/* sticky action bar */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-wink-pink-border bg-white px-4 pb-8 pt-3">
        {isMine ? (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button title="Edit listing" variant="secondary" fullWidth onPress={() => router.push(`/listing/new?edit=${card.id}`)} />
            </View>
            <View className="flex-1">
              <Button title={onHold ? "Release hold" : "Put on hold"} fullWidth onPress={() => toggleHold(card.id)} />
            </View>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            <Pressable accessibilityLabel="Message seller" onPress={messageSeller} className="h-12 w-12 items-center justify-center rounded-card border border-wink-pink-border">
              <MessageCircle size={20} color={colors.ink} />
            </Pressable>
            {card.intent !== "sale" ? (
              <Pressable accessibilityLabel="Request trade" onPress={() => router.push(`/trade/new?listingId=${card.id}`)} className="h-12 w-12 items-center justify-center rounded-card border border-wink-pink-border">
                <Repeat size={20} color={colors.purple} />
              </Pressable>
            ) : null}
            {card.intent !== "trade" ? (
              <>
                <Pressable
                  accessibilityLabel="Buy now"
                  disabled={!card.available}
                  onPress={() => router.push(`/buy/${card.id}`)}
                  className="h-12 w-12 items-center justify-center rounded-card bg-wink-mint"
                >
                  <Zap size={20} color={colors.white} />
                </Pressable>
                <View className="flex-1">
                  <Button
                    title={inCart ? "In cart" : "Add to cart"}
                    variant={inCart ? "mint" : "primary"}
                    fullWidth
                    disabled={!card.available}
                    icon={<ShoppingCart size={16} color={colors.white} />}
                    onPress={() => toggleCart(card.id)}
                  />
                </View>
              </>
            ) : (
              <View className="flex-1">
                <Button title="Request trade" fullWidth onPress={() => router.push(`/trade/new?listingId=${card.id}`)} />
              </View>
            )}
          </View>
        )}
      </View>

      {/* actions menu (§7U) */}
      <Sheet visible={menu} onClose={() => setMenu(false)} title="Listing">
        <MenuItem label={liked ? "Unlike" : "Like"} onPress={() => toggleLike(card.id)} icon={<Heart size={18} color={colors.pink} />} />
        <MenuItem label={saved ? "Remove from saves" : "Save"} onPress={() => toggleSave(card.id)} icon={<Bookmark size={18} color={colors.purple} />} />
        <MenuItem label={inCart ? "Remove from cart" : "Add to cart"} onPress={() => toggleCart(card.id)} />
        <MenuItem label={wishlisted ? "Remove from wishlist" : "Add to wishlist"} onPress={() => toggleWishlist(card.id)} />
        <MenuItem label={owned ? "In your collection ✓" : "I own this — add to collection"} onPress={() => addToCollection([card.id], card.price)} />
        {!isMine && card.intent !== "trade" ? <MenuItem label="Make an offer" onPress={() => { setMenu(false); setOfferOpen(true); }} /> : null}
        <MenuItem label="Comments" onPress={() => { setMenu(false); router.push(`/comments/${card.id}`); }} />
        <MenuItem label="Share to a friend" onPress={() => { setMenu(false); router.push(`/share?kind=listing&id=${card.id}`); }} />
        <MenuItem label="Share outside WinKPop" onPress={() => Share.share({ message: `${listingName(card)} — $${card.price.toFixed(2)} on WinKPop` })} />
        {cat ? <MenuItem label="Open database entry" onPress={() => { setMenu(false); router.push(`/catalog/${cat.id}`); }} /> : null}
        {isMine ? <MenuItem label="Edit listing" onPress={() => { setMenu(false); router.push(`/listing/new?edit=${card.id}`); }} /> : null}
        {!isMine ? <MenuItem label="Report listing" danger onPress={() => { setMenu(false); setReportOpen(true); }} /> : null}
      </Sheet>

      {/* WTS/WTT tap (§7O) */}
      <Sheet visible={intentSheet} onClose={() => setIntentSheet(false)} title={intentLabel(card.intent)}>
        {card.intent !== "trade" ? <MenuItem label={`Buy now for $${card.price.toFixed(2)}`} onPress={() => { setIntentSheet(false); router.push(`/buy/${card.id}`); }} /> : null}
        {card.intent !== "sale" ? <MenuItem label="Offer a trade" onPress={() => { setIntentSheet(false); router.push(`/trade/new?listingId=${card.id}`); }} /> : null}
      </Sheet>

      {/* offers (§7E) */}
      <Sheet visible={offerOpen} onClose={() => { setOfferOpen(false); setOfferSent(false); }} title="Make an offer">
        {offerSent ? (
          <Notice tone="success" text="Offer sent! Track it in Transactions → Buying → Offers." />
        ) : (
          <>
            <Text className="mb-2 text-sm text-wink-muted">Listed at ${card.price.toFixed(2)}{stats ? ` · avg sold $${stats.avg.toFixed(2)}` : ""}</Text>
            <Field label="Your offer ($)" keyboardType="decimal-pad" value={offer} onChangeText={setOffer} placeholder={(card.price * 0.85).toFixed(2)} />
            <Button title="Send offer" fullWidth disabled={!(Number(offer) > 0)} onPress={submitOffer} />
          </>
        )}
      </Sheet>

      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} targetKind="listing" targetId={card.id} />
    </SafeAreaView>
  );
}

function PriceStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View className="items-center">
      <Text className={`font-display ${highlight ? "text-wink-pink" : "text-wink-ink"}`}>${value.toFixed(0)}</Text>
      <Text className="text-xs text-wink-muted">{label}</Text>
    </View>
  );
}
