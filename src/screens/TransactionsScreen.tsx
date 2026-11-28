import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "@/rn";
import { useLocalSearchParams, useRouter } from "@/rn/router";
import { ArrowLeftRight, Package, Plus } from "lucide-react";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  intentLabel,
  Notice,
  PhotocardImage,
  Pill,
  Screen,
  SectionTitle,
  Sheet,
  StatusPill,
  Tabs,
  Text,
  Toggle,
  timeAgo,
} from "@/components";
import { AUTH_THRESHOLD, getPhotocard, GROUP_MAP, TRADE_SERVICE_FEE, type Offer, type TradeRequest } from "@/data";
import { getAnyListing, listingName, useAppStore, EMPTY } from "@/data/appStore";
import { useUserStore } from "@/data/userStore";
import { colors } from "@/theme/colors";
import { useLiveOrders } from "@/lib/useLiveOrders";

type Tab = "buying" | "selling" | "trading" | "tracking";

/**
 * Transactions (§9, §18): Buying (offers / purchases), Selling (active
 * listings with offers & engagement, bulk edit), Trading (incoming / outgoing
 * requests, accept → label + fee + optional authentication, mark complete,
 * collection for trade, donation subscription), and a Tracking hub.
 */
export default function TransactionsScreen() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab ?? "buying");
  useLiveOrders();
  return (
    <Screen padded={false}>
      <View className="px-4 pt-2">
        <Text className="mb-3 font-display text-2xl text-wink-ink">Transactions</Text>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "buying", label: "Buying" },
            { key: "selling", label: "Selling" },
            { key: "trading", label: "Trading" },
            { key: "tracking", label: "Tracking" },
          ]}
        />
        {tab === "buying" ? <Buying /> : null}
        {tab === "selling" ? <Selling /> : null}
        {tab === "trading" ? <Trading /> : null}
        {tab === "tracking" ? <TrackingHubLinks /> : null}
      </View>
    </Screen>
  );
}

/* ------------------------------- Buying -------------------------------- */

function Buying() {
  const router = useRouter();
  const allOffers = useAppStore((s) => s.offers);
  const allOrders = useAppStore((s) => s.orders);
  const offers = allOffers.filter((o) => o.direction === "sent");
  const orders = allOrders.filter((o) => o.kind === "buy");
  const respondOffer = useAppStore((s) => s.respondOffer);
  const cartIds = useUserStore((s) => s.user?.cartIds ?? EMPTY);
  const [sub, setSub] = useState<"offers" | "purchases">("offers");
  const [filter, setFilter] = useState<"all" | "action" | "sent">("all");

  const shown = offers.filter((o) => filter === "all" || (filter === "action" ? o.status === "countered" : o.status === "pending"));
  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <View className="mb-3 flex-row gap-2">
        <Chip label={`Offers (${offers.length})`} active={sub === "offers"} onPress={() => setSub("offers")} />
        <Chip label={`Purchases (${orders.length})`} active={sub === "purchases"} onPress={() => setSub("purchases")} />
      </View>
      {sub === "offers" ? (
        <>
          <View className="mb-3 flex-row gap-2">
            <Chip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
            <Chip label="Action needed" active={filter === "action"} onPress={() => setFilter("action")} />
            <Chip label="Offers sent" active={filter === "sent"} onPress={() => setFilter("sent")} />
          </View>
          {shown.length === 0 ? (
            <>
              <EmptyState emoji="💸" title="No offers here" />
              <Button title="Browse listings" fullWidth onPress={() => router.push("/(tabs)/browse")} />
            </>
          ) : (
            shown.map((o) => <OfferRow key={o.id} offer={o} onRespond={respondOffer} />)
          )}
        </>
      ) : (
        <>
          {cartIds.length ? (
            <Card className="mb-3">
              <Text className="mb-2 font-display text-wink-ink">In your cart ({cartIds.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {cartIds.slice(0, 8).map((id) => {
                    const c = getAnyListing(id);
                    return c ? (
                      <View key={id} className="w-12">
                        <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
                      </View>
                    ) : null;
                  })}
                </View>
              </ScrollView>
              <View className="mt-3">
                <Button size="sm" title="Ready to checkout" onPress={() => router.push("/cart")} />
              </View>
            </Card>
          ) : null}
          {sorted.length === 0 ? <EmptyState emoji="🛍️" title="No purchases yet" /> : null}
          {sorted.map((o) => {
            const c = getAnyListing(o.cardIds[0]);
            return (
              <Pressable key={o.id} onPress={() => router.push(`/card/${o.cardIds[0]}`)} className="mb-3 flex-row items-center gap-3 rounded-card border border-wink-pink-border bg-white p-3">
                {c ? (
                  <View className="w-12">
                    <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
                  </View>
                ) : null}
                <View className="flex-1">
                  <Text className="font-display text-wink-ink" numberOfLines={1}>
                    {o.cardTitle}
                  </Text>
                  <Text className="text-xs text-wink-muted">
                    from @{o.counterparty} · {o.createdAt.slice(0, 10)} · ${o.amount.toFixed(2)}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    <StatusPill status={o.status} />
                    <Pressable onPress={() => router.push(`/tracking/${o.id}`)}>
                      <Text className="text-xs text-wink-pink">View tracking</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </>
      )}
    </>
  );
}

function OfferRow({ offer, onRespond }: { offer: Offer; onRespond: (id: string, a: "accept" | "decline" | "counter", amt?: number) => void }) {
  const router = useRouter();
  const c = getAnyListing(offer.cardId);
  return (
    <Pressable onPress={() => c && router.push(`/card/${c.id}`)} className="mb-3 rounded-card border border-wink-pink-border bg-white p-3">
      <View className="flex-row items-center gap-3">
        {c ? (
          <View className="w-12">
            <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
          </View>
        ) : null}
        <View className="flex-1">
          <Text className="font-display text-wink-ink" numberOfLines={1}>
            {c ? listingName(c) : "Listing"}
          </Text>
          <Text className="text-xs text-wink-muted">
            You offered ${offer.amount.toFixed(2)} to @{offer.counterparty} · {timeAgo(offer.createdAt)}
          </Text>
          {offer.status === "countered" ? (
            <Text className="mt-1 text-xs text-wink-pink">Seller countered: ${offer.counterAmount?.toFixed(2)} — action needed</Text>
          ) : (
            <Text className="mt-1 text-xs text-wink-muted">{offer.status === "pending" ? "Offer sent · waiting on seller" : `Offer ${offer.status}`}</Text>
          )}
        </View>
      </View>
      {offer.status === "countered" ? (
        <View className="mt-2 flex-row gap-2">
          <Button size="sm" title={`Accept $${offer.counterAmount?.toFixed(2)}`} onPress={() => onRespond(offer.id, "accept")} />
          <Button size="sm" variant="secondary" title="Counter" onPress={() => onRespond(offer.id, "counter", ((offer.amount + (offer.counterAmount ?? offer.amount)) / 2))} />
          <Button size="sm" variant="ghost" title="Decline" onPress={() => onRespond(offer.id, "decline")} />
        </View>
      ) : null}
    </Pressable>
  );
}

/* ------------------------------- Selling ------------------------------- */

function Selling() {
  const router = useRouter();
  const me = useUserStore((s) => s.user?.username ?? "");
  const allListings = useAppStore((s) => s.listings);
  const allOffers = useAppStore((s) => s.offers);
  const listings = allListings.filter((l) => l.sellerUsername === me);
  const offers = allOffers.filter((o) => o.direction === "received");
  const setStatus = useAppStore((s) => s.setListingStatus);
  const setPromoted = useAppStore((s) => s.setPromoted);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "sold" | "all">("all");

  const shown = listings.filter((l) => statusFilter === "all" || l.status === statusFilter || (statusFilter === "active" && l.status === "hold"));

  return (
    <>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-display text-wink-ink">Your listings ({listings.length})</Text>
        <View className="flex-row gap-2">
          {listings.length ? <Button size="sm" variant="secondary" title={selectMode ? "Done" : "Bulk edit"} onPress={() => { setSelectMode(!selectMode); setSelected([]); }} /> : null}
          <Button size="sm" title="+ New" onPress={() => router.push("/listing/new")} />
        </View>
      </View>
      <View className="mb-3 flex-row gap-2">
        {(["all", "active", "inactive", "sold"] as const).map((f) => (
          <Chip key={f} label={f[0].toUpperCase() + f.slice(1)} active={statusFilter === f} onPress={() => setStatusFilter(f)} />
        ))}
      </View>
      {selectMode && selected.length ? (
        <View className="mb-3 flex-row flex-wrap gap-2">
          <Button size="sm" title="Activate" onPress={() => setStatus(selected, "active")} />
          <Button size="sm" variant="secondary" title="Deactivate" onPress={() => setStatus(selected, "inactive")} />
          <Button size="sm" variant="mint" title="Promote" onPress={() => setPromoted(selected, true)} />
        </View>
      ) : null}
      {offers.length ? (
        <Notice text={`@${offers[0].counterparty} offered $${offers[0].amount.toFixed(2)} on one of your cards — respond in Messages → Sales.`} />
      ) : null}
      {listings.length === 0 ? (
        <>
          <EmptyState emoji="🏷️" title="No listings yet" subtitle="Zero seller fees — keep 100% of your sale." />
          <Button title="Create listing" fullWidth icon={<Plus size={16} color={colors.white} />} onPress={() => router.push("/listing/new")} />
        </>
      ) : (
        shown.map((l) => {
          const on = selected.includes(l.id);
          return (
            <Pressable
              key={l.id}
              onPress={() => (selectMode ? setSelected((s) => (on ? s.filter((x) => x !== l.id) : [...s, l.id])) : router.push(`/card/${l.id}`))}
              className="mb-3 flex-row gap-3 rounded-card border bg-white p-3"
              style={{ borderColor: on ? colors.pink : colors.pinkBorder }}
            >
              <View className="w-14">
                <PhotocardImage groupId={l.groupId} memberName={l.memberName} imgSeed={l.imgSeed} />
              </View>
              <View className="flex-1">
                <Text className="font-display text-wink-ink" numberOfLines={1}>
                  {l.title}
                </Text>
                <View className="mt-0.5 flex-row items-center gap-1">
                  <Pill label={intentLabel(l.intent)} />
                  <Pill label={l.status} color={colors.mint} bg={colors.mintTint} />
                  {l.promoted ? <Pill label="Promoted" color={colors.pink} bg={colors.pinkTint} /> : null}
                </View>
                <Text className="mt-1 font-display text-wink-ink">{l.intent === "trade" ? "Trade" : `$${l.price.toFixed(2)}`}</Text>
                <Text className="text-xs text-wink-muted">
                  ♥ {l.stats.likes} · 🔖 {l.stats.saves} · 👁 {l.stats.views} · 🛒 {l.stats.carts} · no offers yet
                </Text>
                {!selectMode ? (
                  <View className="mt-1 flex-row gap-3">
                    <Pressable onPress={() => router.push(`/card/${l.id}`)}>
                      <Text className="text-xs text-wink-pink">View listing</Text>
                    </Pressable>
                    <Pressable onPress={() => router.push("/(tabs)/transactions?tab=trading")}>
                      <Text className="text-xs text-wink-pink">View offers</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}
    </>
  );
}

/* ------------------------------- Trading ------------------------------- */

function Trading() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const trades = useAppStore((s) => s.trades);
  const respond = useAppStore((s) => s.respondTrade);
  const payLabel = useAppStore((s) => s.payTradeLabel);
  const complete = useAppStore((s) => s.completeTrade);
  const [dir, setDir] = useState<"incoming" | "outgoing">("incoming");
  const [match, setMatch] = useState<"all" | "wishlist" | "other">("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [labelFor, setLabelFor] = useState<TradeRequest | null>(null);
  const [auth, setAuth] = useState(false);
  const [msg, setMsg] = useState("");

  const counts = {
    incoming: trades.filter((t) => t.direction === "incoming" && t.status === "pending").length,
    outgoing: trades.filter((t) => t.direction === "outgoing" && t.status === "pending").length,
  };
  const shown = trades
    .filter((t) => t.direction === dir)
    .filter((t) => match === "all" || (match === "wishlist" ? t.wishlistMatch : !t.wishlistMatch))
    .filter((t) => groupFilter === "all" || getAnyListing(t.theirCardIds[0])?.groupId === groupFilter);
  const forTrade = (user?.collectionIds ?? []).map(getPhotocard).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const groups = [...new Set(trades.map((t) => getAnyListing(t.theirCardIds[0])?.groupId).filter(Boolean) as string[])];
  const myValue = labelFor ? labelFor.myCardIds.reduce((s, id) => s + (getAnyListing(id)?.price ?? 0), 0) : 0;

  return (
    <>
      <Button title="Browse to Trade" fullWidth icon={<ArrowLeftRight size={16} color={colors.white} />} onPress={() => router.push("/(tabs)/home")} />
      <View className="mt-3">
        <Tabs
          value={dir}
          onChange={setDir}
          tabs={[
            { key: "incoming", label: "Incoming", count: counts.incoming },
            { key: "outgoing", label: "Outgoing", count: counts.outgoing },
          ]}
        />
      </View>

      <SectionTitle title="Your cards available for trade" action="+ Add" onAction={() => router.push("/collection")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2">
          {forTrade.map((c) => (
            <Pressable key={c.id} onPress={() => router.push(`/card/${c.id}`)} className="w-14">
              <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
            </Pressable>
          ))}
          <Pressable onPress={() => router.push("/collection")} className="h-[75px] w-14 items-center justify-center rounded-card border border-dashed border-wink-pink-border">
            <Plus size={16} color={colors.muted} />
          </Pressable>
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          <Chip label="All" active={match === "all" && groupFilter === "all"} onPress={() => { setMatch("all"); setGroupFilter("all"); }} />
          <Chip label="Wishlist match" active={match === "wishlist"} onPress={() => setMatch("wishlist")} />
          <Chip label="Non-wishlist" active={match === "other"} onPress={() => setMatch("other")} />
          {groups.map((g) => (
            <Chip key={g} label={GROUP_MAP[g]?.name ?? g} active={groupFilter === g} onPress={() => setGroupFilter(groupFilter === g ? "all" : g)} />
          ))}
        </View>
      </ScrollView>

      {msg ? <Notice tone="success" text={msg} /> : null}
      {shown.length === 0 ? <EmptyState emoji="🔁" title={`No ${dir} trades`} /> : null}
      {shown.map((t) => {
        const theirs = getAnyListing(t.theirCardIds[0]);
        return (
          <Card key={t.id} className="mb-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-xs text-wink-muted">
                {t.createdAt.slice(0, 10)} · {dir === "incoming" ? "from" : "to"} @{t.partner}
              </Text>
              <View className="flex-row gap-1">
                {t.wishlistMatch ? <Pill label="Wishlist match" color={colors.mint} bg={colors.mintTint} /> : null}
                <StatusPill status={t.status} />
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <TradeSide label="Your card" ids={t.myCardIds} />
              <ArrowLeftRight size={18} color={colors.purple} />
              <TradeSide label="Their card" ids={t.theirCardIds} />
            </View>
            <Text className="mt-2 text-xs text-wink-muted">
              {theirs ? `${theirs.groupName} · ${theirs.era}` : ""} · ratio {t.ratio}
              {t.topUp ? ` · +$${t.topUp.toFixed(2)} cash top-up` : ""}
            </Text>
            {dir === "incoming" && t.status === "pending" ? (
              <View className="mt-2 flex-row gap-2">
                <Button size="sm" title="Accept" onPress={() => { respond(t.id, true); setMsg("Accepted! Please buy the label and ship within 3 days."); }} />
                <Button size="sm" variant="secondary" title="Decline" onPress={() => respond(t.id, false)} />
              </View>
            ) : null}
            {t.status === "accepted" ? (
              <View className="mt-2">
                <Button size="sm" title="Buy shipping label" icon={<Package size={14} color={colors.white} />} onPress={() => { setAuth(false); setLabelFor(t); }} />
              </View>
            ) : null}
            {t.status === "shipped" ? (
              <View className="mt-2">
                <Button size="sm" variant="mint" title="Mark received — complete trade" onPress={() => { complete(t.id); setMsg("Trade complete! Your collection and wishlist were updated."); }} />
              </View>
            ) : null}
          </Card>
        );
      })}

      <SectionTitle title="Smart trading" />
      <Card>
        <Pressable onPress={() => router.push("/wishlists")}>
          <Text className="text-sm text-wink-pink">Browse trades from your wishlist →</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/settings/notifications")} className="mt-2">
          <Text className="text-sm text-wink-pink">Smart match notification filters →</Text>
        </Pressable>
        <Toggle
          label="Donation trading subscription"
          sub="Send in duplicates, get the same number of donated cards back — matched to your groups"
          value={user?.donationSubscription ?? false}
          onChange={(v) => updateUser({ donationSubscription: v })}
        />
      </Card>

      <Sheet visible={!!labelFor} onClose={() => setLabelFor(null)} title="Ship your trade">
        {labelFor ? (
          <>
            <Text className="text-sm text-wink-ink">Tracked label ${(user?.shipping?.domesticTracked ?? 4.75).toFixed(2)} + ${TRADE_SERVICE_FEE.toFixed(2)} service fee</Text>
            {myValue > AUTH_THRESHOLD ? (
              <Toggle label="Authenticate before it ships (+$4)" sub={`Your card is worth over $${AUTH_THRESHOLD} — we verify it before it reaches @${labelFor.partner}`} value={auth} onChange={setAuth} />
            ) : null}
            <Text className="my-2 text-xs text-wink-muted">Charged to your wallet (${(user?.walletBalance ?? 0).toFixed(2)} available).</Text>
            <Button
              title="Pay & print label"
              fullWidth
              onPress={() => {
                const r = payLabel(labelFor.id, auth);
                setLabelFor(null);
                setMsg(r.success ? `Label purchased ($${r.cost.toFixed(2)}). Pack it with a sleeve + toploader!` : (r.error ?? "Payment failed"));
              }}
            />
            <Button title="Packing guide" variant="ghost" fullWidth onPress={() => { setLabelFor(null); router.push("/tutorial?section=packing"); }} />
          </>
        ) : null}
      </Sheet>
    </>
  );
}

function TradeSide({ label, ids }: { label: string; ids: string[] }) {
  const c = getAnyListing(ids[0]);
  return (
    <View className="flex-1 items-center">
      {c ? (
        <View className="w-16">
          <PhotocardImage groupId={c.groupId} memberName={c.memberName} imgSeed={c.imgSeed} />
        </View>
      ) : null}
      <Text className="mt-1 text-center text-wink-ink" style={{ fontSize: 10 }} numberOfLines={2}>
        {c ? `${c.memberName} · ${c.era}` : ""}
        {ids.length > 1 ? ` +${ids.length - 1}` : ""}
      </Text>
      <Text className="text-wink-muted" style={{ fontSize: 9 }}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------- Tracking ------------------------------ */

function TrackingHubLinks() {
  const router = useRouter();
  const orders = useAppStore((s) => s.orders);
  const summary = useMemo(
    () => ({
      trades: orders.filter((o) => o.kind === "trade").length,
      sales: orders.filter((o) => o.kind === "sell").length,
      purchases: orders.filter((o) => o.kind === "buy").length,
      inTransit: orders.filter((o) => o.status === "in_transit").length,
    }),
    [orders],
  );
  return (
    <>
      <Text className="mb-3 font-display text-lg text-wink-ink">Track your activity</Text>
      {(
        [
          ["trade", "Trades", summary.trades],
          ["sell", "Sales", summary.sales],
          ["buy", "Purchases", summary.purchases],
          ["all", "All", orders.length],
        ] as const
      ).map(([k, label, n]) => (
        <Pressable key={k} onPress={() => router.push(`/tracking?kind=${k}`)} className="mb-3 flex-row items-center justify-between rounded-card border border-wink-pink-border bg-white p-4">
          <Text className="font-display text-wink-ink">{label}</Text>
          <Text className="text-sm text-wink-muted">{n} →</Text>
        </Pressable>
      ))}
      <Text className="text-xs text-wink-muted">{summary.inTransit} in transit right now</Text>
    </>
  );
}
