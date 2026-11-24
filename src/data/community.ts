import { PHOTOCARDS } from "./photocards";
import type { CommunityUser, Review, ReviewTag, ShippingOptions } from "./types";
import { REVIEW_TAGS } from "./types";

/**
 * Seed community: the sellers that appear on listings, plus collectors you can
 * follow and message. A real backend would serve these from a profiles table.
 */

const DEFAULT_SHIPPING: ShippingOptions = {
  domesticStamped: 1.25,
  domesticTracked: 4.5,
  intlStamped: 2.5,
  intlTracked: 12,
  freeShipping: false,
};

function user(
  partial: Partial<CommunityUser> & Pick<CommunityUser, "username" | "displayName" | "country">,
): CommunityUser {
  return {
    location: partial.country,
    bio: "",
    verified: false,
    completedTransactions: 10,
    memberSince: 2024,
    avgShipDays: 3,
    avgResponseHours: 6,
    proofs: 10,
    followers: [],
    following: [],
    collectingGroupIds: [],
    internationalTrading: true,
    isPrivate: false,
    isCollectionAccount: false,
    availability: "available",
    shipping: DEFAULT_SHIPPING,
    avatarColor: "#C9A8E0",
    online: false,
    lastActive: "2h ago",
    ...partial,
  };
}

export const COMMUNITY_USERS: CommunityUser[] = [
  user({
    username: "pcfairy",
    displayName: "PC Fairy 🧚",
    country: "US",
    location: "Los Angeles, CA",
    bio: "NJ + IVE seller · ships Mon/Thu · proofs in highlights",
    verified: true,
    completedTransactions: 214,
    memberSince: 2023,
    avgShipDays: 1,
    avgResponseHours: 1,
    proofs: 260,
    collectingGroupIds: ["newjeans", "ive"],
    avatarColor: "#E880A4",
    online: true,
    lastActive: "Active now",
    followers: ["winkdemo", "biasbinder", "seoul_swaps"],
    following: ["biasbinder"],
    instagramMutual: true,
  }),
  user({
    username: "biasbinder",
    displayName: "Bias Binder",
    country: "US",
    location: "Portland, OR",
    bio: "SKZ felix binder ✨ trading only within US",
    completedTransactions: 88,
    proofs: 75,
    collectingGroupIds: ["stray-kids", "txt"],
    internationalTrading: false,
    shipping: { domesticStamped: 1, domesticTracked: 5, freeShipping: false },
    avatarColor: "#F4C06B",
    followers: ["pcfairy"],
    following: ["pcfairy", "winkdemo"],
    instagramMutual: true,
  }),
  user({
    username: "seoul_swaps",
    displayName: "Seoul Swaps",
    country: "KR",
    location: "Seoul, KR",
    bio: "Korea-based · POBs from every store · GOM for LSRFM",
    verified: true,
    completedTransactions: 431,
    memberSince: 2022,
    proofs: 510,
    collectingGroupIds: ["lesserafim", "seventeen"],
    avatarColor: "#5CC0A8",
    online: true,
    lastActive: "Active now",
    shipping: { intlStamped: 3, intlTracked: 14, freeShipping: false },
  }),
  user({
    username: "kpop_kiosk",
    displayName: "K-pop Kiosk",
    country: "CA",
    location: "Toronto, ON",
    bio: "Bulk seller · bundle discounts 3+ cards",
    completedTransactions: 156,
    proofs: 140,
    collectingGroupIds: ["twice", "ive"],
    avatarColor: "#7BBFEA",
    availability: "busy",
    lastActive: "5h ago",
  }),
  user({
    username: "winkvault",
    displayName: "WinKPop Vault",
    country: "US",
    location: "New York, NY",
    bio: "Official WinKPop trading account — trade any card with us 💜",
    verified: true,
    completedTransactions: 1200,
    memberSince: 2026,
    proofs: 1200,
    collectingGroupIds: ["newjeans", "lesserafim", "ive", "stray-kids", "seventeen", "twice"],
    avatarColor: "#7C3AED",
    online: true,
    lastActive: "Active now",
    shipping: { ...DEFAULT_SHIPPING, freeShipping: true },
  }),
  user({
    username: "danielle_dupes",
    displayName: "Danielle Dupes",
    country: "AU",
    location: "Sydney, AU",
    bio: "Only Danielle. Only dupes. 🐰",
    completedTransactions: 33,
    proofs: 22,
    collectingGroupIds: ["newjeans"],
    avatarColor: "#8ED1B8",
    availability: "vacation",
    lastActive: "3d ago",
    instagramMutual: true,
  }),
  user({
    username: "karina_kollects",
    displayName: "Karina Kollects",
    country: "US",
    location: "Brooklyn, NY",
    bio: "aespa collection account · display only 📸",
    isCollectionAccount: true,
    completedTransactions: 0,
    proofs: 0,
    collectingGroupIds: ["aespa"],
    avatarColor: "#8E7CC3",
    lastActive: "1h ago",
    instagramMutual: true,
  }),
  user({
    username: "carat_cafe",
    displayName: "Carat Café",
    country: "US",
    location: "Queens, NY",
    bio: "Local NYC meetups every 2nd Sat ☕",
    completedTransactions: 47,
    proofs: 40,
    collectingGroupIds: ["seventeen"],
    avatarColor: "#5CC0A8",
    isPrivate: true,
    lastActive: "20m ago",
  }),
];

export const USER_MAP: Record<string, CommunityUser> = Object.fromEntries(
  COMMUNITY_USERS.map((u) => [u.username, u]),
);

export function getCommunityUser(username: string): CommunityUser | undefined {
  return USER_MAP[username];
}

/** Usernames already registered — used for signup availability checks (§1U, §1O). */
export const TAKEN_USERNAMES = new Set(COMMUNITY_USERS.map((u) => u.username));
export const REGISTERED_EMAILS = new Set(["taken@winkpop.app", "pcfairy@winkpop.app"]);

/* ------------------------------------------------------------------------- */
/* Reviews                                                                    */
/* ------------------------------------------------------------------------- */

const REVIEW_TEXT: Record<number, string[]> = {
  5: [
    "Card arrived perfectly protected, super fast!",
    "So sweet and quick to reply. Would trade again 💜",
    "Exactly as pictured, toploader + sleeve + cardboard.",
  ],
  4: ["Good condition, shipping took a few extra days.", "Nice seller, slight corner wear not mentioned."],
  3: ["Took a while to ship but card was fine."],
  2: ["Card had a scratch that wasn't in photos."],
  1: ["Never shipped until I opened a case."],
};
const COUNTRIES = ["US", "CA", "KR", "AU", "UK", "PH", "DE"];
const REVIEWERS = ["minji_mania", "felixfan", "ivelove", "svt_17", "once4ever", "unforgiven_u", "jeanie"];

/** Deterministic reviews per user (stars skew high, like real marketplaces). */
export function getReviews(username: string, extra: Review[] = []): Review[] {
  const u = USER_MAP[username];
  const count = u ? Math.min(24, Math.max(0, Math.round(u.completedTransactions / 9))) : 0;
  let seed = 0;
  for (const ch of username) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    seed = (seed * 16807) % 2147483647;
    const r = seed % 100;
    const stars = (r < 72 ? 5 : r < 88 ? 4 : r < 95 ? 3 : r < 98 ? 2 : 1) as Review["stars"];
    const texts = REVIEW_TEXT[stars];
    const card = PHOTOCARDS[seed % PHOTOCARDS.length];
    const tags: ReviewTag[] = stars >= 4 ? REVIEW_TAGS.filter((_, j) => (seed >> j) % 2 === 0) : [];
    const d = new Date(Date.UTC(2026, 10, 18));
    d.setUTCDate(d.getUTCDate() - i * 6 - (seed % 5));
    reviews.push({
      id: `rev-${username}-${i}`,
      subject: username,
      reviewer: REVIEWERS[seed % REVIEWERS.length],
      reviewerCountry: COUNTRIES[seed % COUNTRIES.length],
      stars,
      role: (["purchase", "sale", "trade"] as const)[seed % 3],
      cardTitle: card.title,
      text: texts[seed % texts.length],
      tags,
      date: d.toISOString().slice(0, 10),
    });
  }
  return [...extra.filter((r) => r.subject === username), ...reviews];
}

export interface ReviewSummary {
  average: number;
  count: number;
  /** Index 0 = 1 star … index 4 = 5 stars. */
  breakdown: [number, number, number, number, number];
}

export function summarizeReviews(reviews: Review[]): ReviewSummary {
  const breakdown: ReviewSummary["breakdown"] = [0, 0, 0, 0, 0];
  for (const r of reviews) breakdown[r.stars - 1]++;
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.stars, 0) / count) * 10) / 10 : 0;
  return { average, count, breakdown };
}

/* ------------------------------------------------------------------------- */
/* Badges (§21H–J)                                                            */
/* ------------------------------------------------------------------------- */

export interface Badge {
  id: string;
  label: string;
  emoji: string;
}

export const VERIFIED_THRESHOLD = 100;

export function proofTier(proofs: number): Badge | null {
  if (proofs >= 500) return { id: "tier-diamond", label: "Diamond proofs", emoji: "💎" };
  if (proofs >= 250) return { id: "tier-gold", label: "Gold proofs", emoji: "🥇" };
  if (proofs >= 100) return { id: "tier-silver", label: "Silver proofs", emoji: "🥈" };
  if (proofs >= 25) return { id: "tier-bronze", label: "Bronze proofs", emoji: "🥉" };
  return null;
}

export function computeBadges(input: {
  completedTransactions: number;
  memberSince: number;
  avgShipDays?: number;
  avgResponseHours?: number;
  proofs?: number;
  averageRating?: number;
}): Badge[] {
  const badges: Badge[] = [
    { id: "since", label: `Seller since ${input.memberSince}`, emoji: "📅" },
  ];
  if (input.completedTransactions >= VERIFIED_THRESHOLD)
    badges.push({ id: "verified", label: "Verified seller", emoji: "✅" });
  if ((input.avgShipDays ?? 99) <= 2) badges.push({ id: "fast-ship", label: "Fast shipper", emoji: "🚀" });
  if ((input.avgResponseHours ?? 99) <= 2)
    badges.push({ id: "fast-reply", label: "Fast responder", emoji: "💬" });
  if ((input.averageRating ?? 0) >= 4.7 && input.completedTransactions >= 20)
    badges.push({ id: "reliable", label: "Reliable", emoji: "🛡️" });
  const tier = proofTier(input.proofs ?? 0);
  if (tier) badges.push(tier);
  return badges;
}

/** Three-strikes policy (§22I). */
export const MAX_STRIKES = 3;
export function isBanned(strikes: number): boolean {
  return strikes >= MAX_STRIKES;
}
