import { CATALOG_MAP, catalogIdForListing } from "./catalog";
import { GROUP_MAP } from "./groups";
import { getPhotocard, PHOTOCARDS } from "./photocards";
import { getPriceHistory, getPriceStats } from "./priceHistory";
import type {
  CardType,
  Photocard,
  ShippingMethod,
  ShippingOptions,
  User,
  Wishlist,
} from "./types";
import { SHIPPING_METHOD_LABELS } from "./types";

/**
 * Pure marketplace logic: pricing, fees, cart maths, shipping, validation and
 * matching. Kept free of React/state so every rule is unit-testable and can be
 * moved server-side unchanged.
 */

/* ------------------------------------------------------------------------- */
/* Fees (§20C, §20N)                                                          */
/* ------------------------------------------------------------------------- */

/** Zero seller fees — the headline differentiator vs. Mercari's 10–13%. */
export const SELLER_FEE_RATE = 0;
/** Small, visible buyer-protection/service fee. */
export const BUYER_FEE_RATE = 0.05;
/** Optional paid authentication for cards over $50 (§22B). */
export const AUTH_THRESHOLD = 50;
export const AUTH_FEE = 4;
/** Small service fee when accepting a trade, on top of the label (§9R). */
export const TRADE_SERVICE_FEE = 0.5;
export const CART_EXPIRY_DAYS = 30;
export const MIN_SALE_PRICE = 1;
export const PRICE_INCREMENT = 0.05;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Snap a price to the nearest $0.05 (§6H). */
export function roundToIncrement(price: number, inc = PRICE_INCREMENT): number {
  return round2(Math.round(price / inc) * inc);
}

export function sellerEarnings(price: number): { fee: number; earnings: number } {
  const fee = round2(price * SELLER_FEE_RATE);
  return { fee, earnings: round2(price - fee) };
}

export function validateListing(input: {
  title: string;
  intent: "sale" | "trade" | "both";
  price: number;
  tradeCardCount?: number;
  tradeMode?: "wishlist" | "specific";
}): string | null {
  if (!input.title.trim()) return "Add a title (or pick the photocard type to auto-fill it).";
  if (input.intent !== "trade") {
    if (!Number.isFinite(input.price) || input.price < MIN_SALE_PRICE)
      return `Price must be at least $${MIN_SALE_PRICE.toFixed(2)}.`;
    if (Math.abs(roundToIncrement(input.price) - input.price) > 0.001)
      return "Price must be in $0.05 increments.";
  }
  if (input.intent !== "sale" && input.tradeMode === "specific" && !input.tradeCardCount)
    return "Pick at least one card you'd trade for.";
  return null;
}

/* ------------------------------------------------------------------------- */
/* Price intelligence (§8)                                                    */
/* ------------------------------------------------------------------------- */

export interface PriceSuggestion {
  suggested: number;
  lastSold: number;
  low: number;
  high: number;
}

/** Suggested price from sold history for the card (§6I, automated demand pricing). */
export function suggestPrice(cardId: string): PriceSuggestion | null {
  const stats = getPriceStats(cardId);
  if (!stats) return null;
  return {
    suggested: roundToIncrement(Math.max(MIN_SALE_PRICE, stats.avg)),
    lastSold: stats.last,
    low: stats.low,
    high: stats.high,
  };
}

/** Suggest a price for a database card using any listing of that card. */
export function suggestPriceForCatalog(catalogId: string): PriceSuggestion | null {
  const listing = PHOTOCARDS.find((p) => catalogIdForListing(p) === catalogId);
  if (listing) return suggestPrice(listing.id);
  const cat = CATALOG_MAP[catalogId];
  if (!cat) return null;
  const base = TYPE_BASE[cat.type];
  return { suggested: roundToIncrement(base), lastSold: base, low: base * 0.7, high: base * 1.4 };
}

const TYPE_BASE: Record<CardType, number> = {
  Album: 7,
  POB: 18,
  Fansign: 95,
  Broadcast: 55,
  "Season's Greetings": 22,
  Collab: 14,
  MD: 11,
  "Lucky Draw": 70,
};

/** Smart pricing: nudge towards the recent average, never below the floor. */
export function smartPrice(current: number, cardId: string, daysListed: number): number {
  const stats = getPriceStats(cardId);
  if (!stats) return current;
  const target = daysListed > 14 ? stats.low : stats.avg;
  const next = current + (target - current) * 0.25;
  return roundToIncrement(Math.max(MIN_SALE_PRICE, next));
}

const SALE_COUNTRIES = ["US", "KR", "CA", "PH", "UK", "AU", "JP", "DE"];
export interface RecentSale {
  date: string;
  country: string;
  price: number;
}

/** Recent completed sales with country (§3U, §8H). */
export function getRecentSales(cardId: string): RecentSale[] {
  const card = getPhotocard(cardId);
  return getPriceHistory(cardId)
    .slice(-6)
    .reverse()
    .map((p, i) => ({
      date: p.date,
      price: p.price,
      country: SALE_COUNTRIES[((card?.imgSeed ?? 1) + i) % SALE_COUNTRIES.length],
    }));
}

/** Per-group price guide by card type (§8D). */
export function getGroupPriceGuide(groupId: string, listings: Photocard[] = PHOTOCARDS) {
  const byType = new Map<CardType, number[]>();
  for (const c of listings) {
    if (c.groupId !== groupId) continue;
    byType.set(c.type, [...(byType.get(c.type) ?? []), c.price]);
  }
  return [...byType.entries()]
    .map(([type, prices]) => ({
      type,
      low: round2(Math.min(...prices)),
      avg: round2(prices.reduce((a, b) => a + b, 0) / prices.length),
      high: round2(Math.max(...prices)),
      count: prices.length,
    }))
    .sort((a, b) => b.avg - a.avg);
}

/** External price sources the guide aggregates (§8F). */
export const PRICE_SOURCES = ["WinKPop sales", "Pocamarket", "Mercari", "Neokyo", "Vinted"];

/* ------------------------------------------------------------------------- */
/* Cart & checkout (§7)                                                       */
/* ------------------------------------------------------------------------- */

export const COUPONS: Record<string, { label: string; pct?: number; flat?: number; waiveFee?: boolean }> = {
  WINK10: { label: "10% off your order", pct: 0.1 },
  FIRSTTRADE: { label: "First order: no service fee", waiveFee: true },
  WELCOME5: { label: "$5 off", flat: 5 },
};

/** Bundle discount when buying several cards from one seller (§7C, §7F). */
export function bundleDiscountRate(cardsFromSeller: number): number {
  if (cardsFromSeller >= 5) return 0.15;
  if (cardsFromSeller >= 3) return 0.1;
  if (cardsFromSeller === 2) return 0.05;
  return 0;
}

export interface CartQuote {
  sellers: { seller: string; cards: Photocard[]; subtotal: number; discount: number }[];
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  serviceFee: number;
  total: number;
  couponError?: string;
}

export function priceCart(cards: Photocard[], coupon?: string): CartQuote {
  const groups = new Map<string, Photocard[]>();
  for (const c of cards) groups.set(c.sellerUsername, [...(groups.get(c.sellerUsername) ?? []), c]);
  const sellers = [...groups.entries()].map(([seller, list]) => {
    const subtotal = round2(list.reduce((s, c) => s + c.price, 0));
    return { seller, cards: list, subtotal, discount: round2(subtotal * bundleDiscountRate(list.length)) };
  });
  const subtotal = round2(sellers.reduce((s, x) => s + x.subtotal, 0));
  const bundleDiscount = round2(sellers.reduce((s, x) => s + x.discount, 0));
  let afterBundle = subtotal - bundleDiscount;

  let couponDiscount = 0;
  let waiveFee = false;
  let couponError: string | undefined;
  if (coupon && coupon.trim()) {
    const c = COUPONS[coupon.trim().toUpperCase()];
    if (!c) couponError = "That code isn't valid.";
    else {
      if (c.pct) couponDiscount = afterBundle * c.pct;
      if (c.flat) couponDiscount = Math.min(afterBundle, c.flat);
      waiveFee = Boolean(c.waiveFee);
    }
  }
  couponDiscount = round2(couponDiscount);
  afterBundle = round2(afterBundle - couponDiscount);
  const serviceFee = waiveFee ? 0 : round2(afterBundle * BUYER_FEE_RATE);
  return {
    sellers,
    subtotal,
    bundleDiscount,
    couponDiscount,
    serviceFee,
    total: round2(afterBundle + serviceFee),
    couponError,
  };
}

/** Cart items older than 30 days are auto-removed (§7Y). */
export function pruneExpiredCart(
  cartIds: string[],
  addedAt: Record<string, string>,
  now: Date = new Date(),
): string[] {
  const cutoff = now.getTime() - CART_EXPIRY_DAYS * 24 * 3600 * 1000;
  return cartIds.filter((id) => {
    const at = addedAt[id];
    return !at || new Date(at).getTime() >= cutoff;
  });
}

/* ------------------------------------------------------------------------- */
/* Shipping (§19)                                                             */
/* ------------------------------------------------------------------------- */

/** Options a seller actually offers — blank prices are hidden (§19A). */
export function offeredShipping(opts?: ShippingOptions): { method: ShippingMethod; label: string; price: number }[] {
  if (!opts) return [];
  return (Object.keys(SHIPPING_METHOD_LABELS) as ShippingMethod[])
    .filter((m) => typeof opts[m] === "number")
    .map((m) => ({ method: m, label: SHIPPING_METHOD_LABELS[m], price: opts.freeShipping ? 0 : (opts[m] as number) }));
}

export function hasShippingSetup(opts?: ShippingOptions): boolean {
  return Boolean(opts && (opts.freeShipping || offeredShipping(opts).length > 0));
}

/** Short shipping summary for profiles, e.g. "stamped ww · tracked dom." (§23T). */
export function shippingSummary(opts?: ShippingOptions): string {
  if (!opts) return "Shipping not set up";
  const parts: string[] = [];
  if (opts.freeShipping) parts.push("free shipping");
  const stamped = [opts.domesticStamped, opts.intlStamped];
  const tracked = [opts.domesticTracked, opts.intlTracked];
  if (stamped[0] != null && stamped[1] != null) parts.push("stamped ww");
  else if (stamped[0] != null) parts.push("stamped dom. only");
  else if (stamped[1] != null) parts.push("stamped intl.");
  if (tracked[0] != null && tracked[1] != null) parts.push("tracked ww");
  else if (tracked[0] != null) parts.push("tracked dom. only");
  else if (tracked[1] != null) parts.push("tracked intl.");
  return parts.join(" · ") || "Shipping not set up";
}

/** Package-based label quotes (§19D). Weight in ounces. */
export function quoteLabels(weightOz: number, international: boolean) {
  const w = Math.max(0.1, weightOz);
  const quotes = international
    ? [
        { carrier: "USPS First-Class Intl (stamped)", price: 1.7 + w * 0.3, days: "7–21" },
        { carrier: "USPS First-Class Intl (tracked)", price: 14 + w * 0.9, days: "7–14" },
        { carrier: "DHL eCommerce", price: 18 + w * 0.6, days: "5–9" },
      ]
    : [
        { carrier: "USPS stamp (letter)", price: w <= 1 ? 0.73 : 0.73 + Math.ceil(w - 1) * 0.28, days: "2–7" },
        { carrier: "USPS Ground Advantage", price: 4.25 + w * 0.15, days: "2–5" },
        { carrier: "UPS Ground", price: 7.5 + w * 0.2, days: "1–5" },
      ];
  return quotes.map((q) => ({ ...q, price: round2(q.price) }));
}

/** Customs / extra fees for international orders (§19G). */
export function customsFees(country: string, value: number): { label: string; amount: number } | null {
  const c = country.toUpperCase();
  if (c === "CA") return { label: "Canada GST + CBSA handling", amount: round2(value * 0.05 + (value > 20 ? 9.95 : 0)) };
  if (c === "UK" || c === "GB") return { label: "UK VAT", amount: round2(value * 0.2) };
  if (c === "AU") return { label: "AU GST (over $1000 only)", amount: value > 1000 ? round2(value * 0.1) : 0 };
  if (c === "DE") return { label: "EU VAT", amount: round2(value * 0.19) };
  return null;
}

export const PACKING_GUIDE = [
  "Sleeve the card in a penny sleeve.",
  "Slide it into a toploader and seal the top with tape (pull tab!).",
  "Sandwich between two pieces of cardboard, slightly larger than the toploader.",
  "Use a rigid or bubble mailer; write 'DO NOT BEND' on both sides.",
  "Stamped: record a short drop-off video and upload it as proof.",
  "Tracked: the tracking number syncs automatically once the label is scanned.",
];

/* ------------------------------------------------------------------------- */
/* Validation (§1, §12T, §13E, §13V)                                          */
/* ------------------------------------------------------------------------- */

export const MIN_AGE = 13;
export const MIN_USERNAME = 6;
export const MAX_CAPTION = 500;
export const MAX_WISHLIST_NAME = 40;
export const MAX_POST_MEDIA = 10;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateUsername(username: string, taken: Set<string>): string | null {
  const u = username.trim().toLowerCase();
  if (u.length < MIN_USERNAME) return `Usernames need at least ${MIN_USERNAME} characters.`;
  if (!/^[a-z0-9._]+$/.test(u)) return "Use letters, numbers, dots and underscores only.";
  if (taken.has(u)) return "That username is taken.";
  return null;
}

export function validateAge(age: number): string | null {
  if (!Number.isFinite(age) || age <= 0) return "Enter your age.";
  if (age < MIN_AGE) return `You must be ${MIN_AGE} or older to use WinKPop.`;
  return null;
}

export function isValidUrl(url: string): boolean {
  return /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(url.trim());
}

export function extractHashtags(text: string): string[] {
  return [...new Set((text.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((t) => t.slice(1).toLowerCase()))];
}

/* ------------------------------------------------------------------------- */
/* Matching & recommendations (§4H, §7K, §9P, §12O–P)                         */
/* ------------------------------------------------------------------------- */

/** Listings that match any card on the user's wishlists. */
export function findWishlistMatches(wishlists: Wishlist[], listings: Photocard[] = PHOTOCARDS): Photocard[] {
  const wanted = new Set(wishlists.flatMap((w) => w.cardIds));
  return listings.filter((l) => l.available && wanted.has(catalogIdForListing(l)));
}

/** Who has (is listing) cards from a wishlist (§12O). */
export function whoHasWishlistCards(wishlist: Wishlist, listings: Photocard[] = PHOTOCARDS) {
  const wanted = new Set(wishlist.cardIds);
  const out = new Map<string, Photocard[]>();
  for (const l of listings) {
    if (!wanted.has(catalogIdForListing(l))) continue;
    out.set(l.sellerUsername, [...(out.get(l.sellerUsername) ?? []), l]);
  }
  return [...out.entries()].map(([username, cards]) => ({ username, cards }));
}

/**
 * Smart trade matches: listings open to trade whose catalog card is on my
 * wishlist, where I own something from the same group to offer.
 */
export function smartTradeMatches(
  wishlists: Wishlist[],
  collectionIds: string[],
  listings: Photocard[] = PHOTOCARDS,
): { listing: Photocard; offer: Photocard[] }[] {
  const mine = collectionIds.map(getPhotocard).filter((c): c is Photocard => Boolean(c));
  return findWishlistMatches(wishlists, listings)
    .filter((l) => l.intent !== "sale")
    .map((listing) => ({ listing, offer: mine.filter((m) => m.groupId === listing.groupId) }))
    .filter((m) => m.offer.length > 0);
}

/** Notification filters for smart matches (§9Q). */
export function passesMatchFilters(
  listing: Photocard,
  prefs: User["notificationPrefs"],
  sellerCountry: string | undefined,
  myCountry: string,
): boolean {
  if (prefs.maxPrice != null && listing.price > prefs.maxPrice) return false;
  if (prefs.domesticOnly && sellerCountry && sellerCountry !== myCountry) return false;
  return true;
}

/**
 * Recommendations from collecting groups, wishlist, likes and cart (§4H):
 * score each listing by group/member affinity, then popularity.
 */
export function recommend(
  user: Pick<User, "collectingGroupIds" | "likesIds" | "cartIds" | "wishlistIds" | "collectingMembers">,
  listings: Photocard[] = PHOTOCARDS,
  limit = 20,
): Photocard[] {
  const signal = [...user.likesIds, ...user.cartIds, ...user.wishlistIds]
    .map(getPhotocard)
    .filter((c): c is Photocard => Boolean(c));
  const groupScore = new Map<string, number>();
  const memberScore = new Map<string, number>();
  for (const g of user.collectingGroupIds) groupScore.set(g, (groupScore.get(g) ?? 0) + 3);
  for (const ms of Object.values(user.collectingMembers ?? {}))
    for (const m of ms) memberScore.set(m, (memberScore.get(m) ?? 0) + 3);
  for (const c of signal) {
    groupScore.set(c.groupId, (groupScore.get(c.groupId) ?? 0) + 1);
    memberScore.set(c.memberId, (memberScore.get(c.memberId) ?? 0) + 2);
  }
  const seen = new Set(signal.map((c) => c.id));
  return listings
    .filter((l) => l.available && !seen.has(l.id))
    .map((l) => ({
      l,
      score: (groupScore.get(l.groupId) ?? 0) * 10 + (memberScore.get(l.memberId) ?? 0) * 10 + l.popularity / 100,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.l);
}

/** Similar items under a listing (§4I): same member first, then same group/type. */
export function similarListings(card: Photocard, listings: Photocard[] = PHOTOCARDS, limit = 6): Photocard[] {
  return listings
    .filter((l) => l.id !== card.id && l.groupId === card.groupId)
    .map((l) => ({ l, s: (l.memberId === card.memberId ? 2 : 0) + (l.type === card.type ? 1 : 0) + (l.era === card.era ? 1 : 0) }))
    .sort((a, b) => b.s - a.s || b.l.popularity - a.l.popularity)
    .slice(0, limit)
    .map((x) => x.l);
}

/* ------------------------------------------------------------------------- */
/* Collection stats (§11)                                                     */
/* ------------------------------------------------------------------------- */

export interface CollectionStats {
  totalCards: number;
  uniqueCards: number;
  groups: number;
  duplicates: number;
  estimatedValue: number;
  totalCost: number;
  byGroup: { groupId: string; name: string; count: number; value: number; cost: number }[];
  byMember: { memberName: string; groupId: string; count: number; cost: number }[];
}

export function collectionStats(
  ids: string[],
  qty: Record<string, number> = {},
  cost: Record<string, number> = {},
): CollectionStats {
  const cards = ids.map(getPhotocard).filter((c): c is Photocard => Boolean(c));
  const byGroup = new Map<string, { count: number; value: number; cost: number }>();
  const byMember = new Map<string, { memberName: string; groupId: string; count: number; cost: number }>();
  let totalCards = 0;
  let duplicates = 0;
  let value = 0;
  let totalCost = 0;
  for (const c of cards) {
    const q = Math.max(1, qty[c.id] ?? 1);
    const v = (getPriceStats(c.id)?.avg ?? c.price) * q;
    const paid = (cost[c.id] ?? c.price) * q;
    totalCards += q;
    duplicates += q - 1;
    value += v;
    totalCost += paid;
    const g = byGroup.get(c.groupId) ?? { count: 0, value: 0, cost: 0 };
    byGroup.set(c.groupId, { count: g.count + q, value: g.value + v, cost: g.cost + paid });
    const m = byMember.get(c.memberId) ?? { memberName: c.memberName, groupId: c.groupId, count: 0, cost: 0 };
    byMember.set(c.memberId, { ...m, count: m.count + q, cost: m.cost + paid });
  }
  return {
    totalCards,
    uniqueCards: cards.length,
    groups: byGroup.size,
    duplicates,
    estimatedValue: round2(value),
    totalCost: round2(totalCost),
    byGroup: [...byGroup.entries()]
      .map(([groupId, g]) => ({ groupId, name: GROUP_MAP[groupId]?.name ?? groupId, count: g.count, value: round2(g.value), cost: round2(g.cost) }))
      .sort((a, b) => b.count - a.count),
    byMember: [...byMember.values()].map((m) => ({ ...m, cost: round2(m.cost) })).sort((a, b) => b.count - a.count),
  };
}

/** Collection value over the last 12 months (§8G). */
export function collectionValueTrend(ids: string[], qty: Record<string, number> = {}) {
  const series = ids.map((id) => ({ q: Math.max(1, qty[id] ?? 1), h: getPriceHistory(id) }));
  const months = series[0]?.h.map((p) => p.date) ?? [];
  return months.map((date, i) => ({
    date,
    value: round2(series.reduce((s, x) => s + (x.h[i]?.price ?? 0) * x.q, 0)),
  }));
}

/** Spending tracked this calendar month (§ personal spending limit). */
export function monthlySpend(orders: { kind: string; amount: number; createdAt: string }[], offApp: number, now = new Date()) {
  const ym = now.toISOString().slice(0, 7);
  return round2(
    orders.filter((o) => o.kind === "buy" && o.createdAt.startsWith(ym)).reduce((s, o) => s + o.amount, 0) + offApp,
  );
}
