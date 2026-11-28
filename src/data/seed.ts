import { CATALOG, catalogIdForListing } from "./catalog";
import { PHOTOCARDS } from "./photocards";
import { TRANSACTIONS } from "./transactions";
import type {
  AppNotification,
  Conversation,
  GroupOrder,
  Highlight,
  Offer,
  Order,
  Post,
  Story,
  TradeRequest,
  Wishlist,
} from "./types";

/**
 * Seed content for the social + commerce features. Dates are relative to "now"
 * so stories stay inside their 24-hour window and feeds look fresh.
 */

export const ME = "winkdemo";

export function hoursAgo(h: number, now = Date.now()): string {
  return new Date(now - h * 3600 * 1000).toISOString();
}

const pc = (i: number) => PHOTOCARDS[i % PHOTOCARDS.length];

export function seedPosts(): Post[] {
  const base = {
    accountTags: [],
    hashtags: [],
    savedBy: [],
    commentsOff: false,
    hideLikes: false,
    archived: false,
  };
  return [
    {
      ...base,
      id: "post-1",
      author: "pcfairy",
      type: "Collection Drop",
      media: [
        { id: "m1", seed: 11, kind: "photo" },
        { id: "m2", seed: 12, kind: "photo" },
        { id: "m3", seed: 13, kind: "photo" },
      ],
      caption: "New drop! NJ How Sweet POBs going up tonight 8pm EST 💙 #newjeans #howsweet",
      hashtags: ["newjeans", "howsweet"],
      groupTags: [{ groupId: "newjeans", memberIds: [] }],
      createdAt: hoursAgo(2),
      likes: ["biasbinder", "seoul_swaps", "kpop_kiosk"],
      comments: [
        { id: "c1", author: "biasbinder", text: "Hanni pls 🙏", at: hoursAgo(1.5), likes: ["pcfairy"] },
        { id: "c2", author: "pcfairy", text: "Hanni is yours if you want her!", at: hoursAgo(1), likes: [], parentId: "c1" },
      ],
      community: "display",
    },
    {
      ...base,
      id: "post-2",
      author: "biasbinder",
      type: "ISO",
      media: [{ id: "m4", seed: 21, kind: "photo" }],
      caption: "ISO Felix ATE Soundwave POB — can trade Hyunjin or pay $$ #straykids #felix #iso",
      hashtags: ["straykids", "felix", "iso"],
      groupTags: [{ groupId: "stray-kids", memberIds: ["skz-felix"] }],
      createdAt: hoursAgo(5),
      likes: ["winkdemo"],
      comments: [],
    },
    {
      ...base,
      id: "post-3",
      author: "seoul_swaps",
      type: "DWAYOR",
      media: [{ id: "m5", seed: 31, kind: "photo" }],
      caption:
        "⚠️ DWAYOR: @scammer_acc took payment for a Kazuha fansign and blocked me. Please check the fake card DB before buying. #dwayor #lesserafim",
      hashtags: ["dwayor", "lesserafim"],
      groupTags: [{ groupId: "lesserafim", memberIds: ["lsrfm-kazuha"] }],
      createdAt: hoursAgo(9),
      likes: ["pcfairy", "kpop_kiosk", "winkvault"],
      comments: [{ id: "c3", author: "winkvault", text: "Thanks for reporting — account struck ✋", at: hoursAgo(8), likes: [], pinned: true }],
    },
    {
      ...base,
      id: "post-4",
      author: "karina_kollects",
      type: "Collection Display",
      media: [
        { id: "m6", seed: 41, kind: "photo" },
        { id: "m7", seed: 42, kind: "photo" },
      ],
      caption: "Finally finished my Whiplash binder page 🖤 #aespa #karina #binder",
      hashtags: ["aespa", "karina", "binder"],
      groupTags: [{ groupId: "aespa", memberIds: ["aespa-karina"] }],
      createdAt: hoursAgo(20),
      likes: ["pcfairy", "winkdemo", "carat_cafe"],
      comments: [],
      community: "display",
    },
    {
      ...base,
      id: "post-5",
      author: "carat_cafe",
      type: "Other",
      media: [{ id: "m8", seed: 51, kind: "photo" }],
      link: "https://example.com/nyc-carat-meetup",
      caption: "NYC trading meetup this Saturday at Koreatown — bring your binders! #local #seventeen",
      hashtags: ["local", "seventeen"],
      groupTags: [{ groupId: "seventeen", memberIds: [] }],
      location: "Koreatown, NYC",
      createdAt: hoursAgo(30),
      likes: ["pcfairy"],
      comments: [],
      community: "local",
    },
    {
      ...base,
      id: "post-6",
      author: "danielle_dupes",
      type: "Art",
      media: [{ id: "m9", seed: 61, kind: "photo" }],
      caption: "Drew Danielle as a bunny 🐰 free to use as binder decor #newjeans #art",
      hashtags: ["newjeans", "art"],
      groupTags: [{ groupId: "newjeans", memberIds: ["nj-danielle"] }],
      createdAt: hoursAgo(48),
      likes: ["winkdemo", "pcfairy", "biasbinder", "karina_kollects"],
      comments: [],
      community: "art",
    },
    {
      ...base,
      id: "post-me-1",
      author: ME,
      type: "ISO",
      media: [{ id: "m10", seed: 71, kind: "photo" }],
      caption: "ISO any Wonyoung I've MINE POB 💗 paying well or trading #ive #wonyoung #iso",
      hashtags: ["ive", "wonyoung", "iso"],
      groupTags: [{ groupId: "ive", memberIds: ["ive-wonyoung"] }],
      createdAt: hoursAgo(70),
      likes: ["pcfairy"],
      comments: [],
    },
  ];
}

export function seedStories(): Story[] {
  const base = { likedBy: [], closeFriends: false, hiddenFrom: [], archived: false, taggedAccounts: [] };
  return [
    { ...base, id: "st-1", author: "pcfairy", seed: 101, text: "Packing orders 📦", createdAt: hoursAgo(1), viewers: [] },
    { ...base, id: "st-2", author: "pcfairy", seed: 102, text: "Shipping Thursday!", createdAt: hoursAgo(3), viewers: [] },
    { ...base, id: "st-3", author: "seoul_swaps", seed: 103, text: "Soundwave POBs arrived", song: "UNFORGIVEN", createdAt: hoursAgo(4), viewers: [] },
    { ...base, id: "st-4", author: "biasbinder", seed: 104, text: "Binder tour soon 👀", createdAt: hoursAgo(6), viewers: [] },
    { ...base, id: "st-5", author: "winkvault", seed: 105, text: "Trade ANY card with us this week 💜", createdAt: hoursAgo(10), viewers: [] },
    { ...base, id: "st-old", author: ME, seed: 106, text: "Proof: sent to @pcfairy", createdAt: hoursAgo(60), viewers: ["pcfairy"], archived: true },
  ];
}

export function seedHighlights(): Highlight[] {
  return [
    { id: "hl-1", owner: ME, title: "Proofs", coverSeed: 106, storyIds: ["st-old"] },
    { id: "hl-2", owner: "pcfairy", title: "Proofs", coverSeed: 101, storyIds: ["st-1"] },
  ];
}

export function seedConversations(): Conversation[] {
  const msg = (id: string, from: string, text: string, h: number, extra: Partial<Conversation["messages"][number]> = {}) => ({
    id,
    from,
    kind: "text" as const,
    text,
    at: hoursAgo(h),
    likedBy: [],
    readBy: [from],
    ...extra,
  });
  const base = { pinned: false, muted: false, markedUnread: false, flagged: false, isRequest: false, isGroup: false };
  return [
    {
      ...base,
      id: "dm-1",
      participants: [ME, "pcfairy"],
      category: "purchase",
      dealStatus: "pending",
      folder: "On the way",
      messages: [
        msg("x1", ME, "Hi! Is it still available?", 6, { readBy: [ME, "pcfairy"] }),
        msg("x2", "pcfairy", "Yes! Want me to hold it for you?", 5.5),
        msg("x3", "pcfairy", "", 5.4, { kind: "listing", refId: pc(2).id, text: undefined }),
        msg("x4", "pcfairy", "Shipped today, tracking in the app 💜", 2),
      ],
    },
    {
      ...base,
      id: "dm-2",
      participants: [ME, "biasbinder"],
      category: "trade",
      dealStatus: "pending",
      messages: [
        msg("y1", "biasbinder", "Would you trade your Hyunjin for my Felix?", 26),
        msg("y2", ME, "Maybe! Can you add $2 top-up?", 25, { readBy: [ME, "biasbinder"] }),
        msg("y3", "biasbinder", "Deal 🤝 sending the request now", 24),
      ],
    },
    {
      ...base,
      id: "dm-3",
      participants: [ME, "kpop_kiosk"],
      category: "sale",
      dealStatus: "completed",
      messages: [
        msg("z1", "kpop_kiosk", "Received the card, thank you!!", 72, { readBy: [ME, "kpop_kiosk"] }),
        msg("z2", ME, "Yay, enjoy!", 71, { readBy: [ME, "kpop_kiosk"] }),
      ],
    },
    {
      ...base,
      id: "gc-1",
      participants: [ME, "pcfairy", "seoul_swaps", "biasbinder"],
      isGroup: true,
      name: "NJ How Sweet GO 💙",
      owner: "seoul_swaps",
      category: "community",
      dealStatus: "pending",
      folder: "GO",
      messages: [
        msg("g1", "seoul_swaps", "GO confirmed at 82%! Shipping to me next week.", 12),
        msg("g2", "pcfairy", "Yay 🎉", 11),
      ],
    },
    {
      ...base,
      id: "req-1",
      participants: [ME, "carat_cafe"],
      category: "community",
      dealStatus: "pending",
      isRequest: true,
      messages: [msg("r1", "carat_cafe", "Hi! Are you coming to the NYC meetup?", 3)],
    },
  ];
}

export function seedOffers(): Offer[] {
  return [
    { id: "of-1", cardId: pc(14).id, direction: "sent", counterparty: pc(14).sellerUsername, amount: round(pc(14).price * 0.8), counterAmount: round(pc(14).price * 0.9), status: "countered", createdAt: hoursAgo(20) },
    { id: "of-2", cardId: pc(17).id, direction: "sent", counterparty: pc(17).sellerUsername, amount: round(pc(17).price * 0.85), status: "pending", createdAt: hoursAgo(8) },
    { id: "of-3", cardId: "mine", direction: "received", counterparty: "biasbinder", amount: 6, status: "pending", createdAt: hoursAgo(4) },
  ];
}

function round(n: number) {
  return Math.round(n * 20) / 20;
}

export function seedTrades(): TradeRequest[] {
  return [
    { id: "tr-1", direction: "incoming", partner: "biasbinder", myCardIds: [pc(40).id], theirCardIds: [pc(41).id], topUp: 2, ratio: "1:1 + top-up", status: "pending", createdAt: hoursAgo(24), wishlistMatch: true },
    { id: "tr-2", direction: "incoming", partner: "danielle_dupes", myCardIds: [pc(3).id], theirCardIds: [pc(4).id, pc(5).id], topUp: 0, ratio: "n:1", status: "pending", createdAt: hoursAgo(50), wishlistMatch: false },
    { id: "tr-3", direction: "outgoing", partner: "pcfairy", myCardIds: [pc(9).id], theirCardIds: [pc(10).id], topUp: 0, ratio: "1:1", status: "declined", createdAt: hoursAgo(96), wishlistMatch: true },
    { id: "tr-4", direction: "outgoing", partner: "seoul_swaps", myCardIds: [pc(60).id], theirCardIds: [pc(61).id], topUp: 0, ratio: "1:1", status: "pending", createdAt: hoursAgo(12), wishlistMatch: true },
  ];
}

const STATUS_FROM_TXN: Record<string, { status: Order["status"]; step: number }> = {
  pending: { status: "pending", step: 0 },
  paid: { status: "pending", step: 1 },
  shipped: { status: "in_transit", step: 3 },
  delivered: { status: "delivered", step: 4 },
  completed: { status: "completed", step: 5 },
  disputed: { status: "pending", step: 2 },
};

export function seedOrders(): Order[] {
  return TRANSACTIONS.map((t, i) => {
    const card = PHOTOCARDS.find((c) => c.id === t.cardId);
    const s = STATUS_FROM_TXN[t.status];
    return {
      id: `ord-${t.id}`,
      kind: t.kind,
      cardIds: [t.cardId],
      cardTitle: t.cardTitle,
      counterparty: t.counterpartyUsername,
      amount: t.amount,
      fee: t.kind === "buy" ? Math.round(t.amount * 5) / 100 : 0,
      status: s.status,
      step: s.step,
      shippingMethod: i % 2 ? "domesticStamped" : "domesticTracked",
      trackingNumber: `9400 1000 0000 ${String(4821 + i * 37).padStart(4, "0")}`,
      createdAt: t.createdAt,
      reviewed: t.status === "completed",
      groupId: card?.groupId ?? "newjeans",
    };
  });
}

export function seedWishlists(): Wishlist[] {
  const wonyoung = CATALOG.filter((c) => c.memberId === "ive-wonyoung").slice(0, 6);
  const nj = CATALOG.filter((c) => c.groupId === "newjeans" && c.era === "How Sweet").slice(0, 8);
  // Guarantee at least one live listing matches, so "who has it" has data.
  const live = catalogIdForListing(PHOTOCARDS.find((p) => p.groupId === "ive")!);
  return [
    {
      id: "wl-1",
      name: "Wonyoung prio 💗",
      groupId: "ive",
      cardIds: [...new Set([live, ...wonyoung.map((c) => c.id)])],
      descriptions: [],
      priority: true,
      level: "high",
      tag: "ISO",
      showOnProfile: true,
      createdAt: hoursAgo(300),
    },
    {
      id: "wl-2",
      name: "NJ How Sweet",
      groupId: "newjeans",
      cardIds: nj.map((c) => c.id),
      descriptions: ["Any Hanni lucky draw"],
      priority: false,
      level: "medium",
      tag: "WTB",
      folder: "NewJeans",
      showOnProfile: false,
      createdAt: hoursAgo(200),
    },
  ];
}

export function seedNotifications(): AppNotification[] {
  return [
    { id: "n1", kind: "wishlist_match", text: "A Wonyoung card from your wishlist was just listed by @pcfairy", at: hoursAgo(1), read: false, href: `/card/${PHOTOCARDS.find((p) => p.groupId === "ive")!.id}` },
    { id: "n2", kind: "offer", text: "@kpop_kiosk countered your offer", at: hoursAgo(3), read: false, href: "/(tabs)/transactions" },
    { id: "n3", kind: "smart_trade", text: "Smart trade: @biasbinder wants your Hyunjin and has your Felix", at: hoursAgo(9), read: false, href: "/(tabs)/transactions" },
    { id: "n4", kind: "order", text: "Your order from @seoul_swaps is in transit", at: hoursAgo(20), read: true, href: "/tracking" },
    { id: "n5", kind: "follow", text: "@karina_kollects started following you", at: hoursAgo(30), read: true, href: "/user/karina_kollects" },
    { id: "n6", kind: "group", text: "New LE SSERAFIM listings in CRAZY era", at: hoursAgo(40), read: true, href: "/group/lesserafim" },
  ];
}

export function seedGroupOrders(): GroupOrder[] {
  const nj = PHOTOCARDS.filter((p) => p.groupId === "newjeans").slice(0, 10);
  const lsr = PHOTOCARDS.filter((p) => p.groupId === "lesserafim").slice(0, 8);
  return [
    {
      id: "go-1",
      title: "NewJeans How Sweet Weverse POB set",
      groupId: "newjeans",
      bulkSeller: "seoul_swaps",
      gom: "pcfairy",
      cardIds: nj.map((c) => c.id),
      pricePerCard: 4.5,
      thresholdPct: 70,
      claims: Object.fromEntries(nj.slice(0, 6).map((c, i) => [c.id, ["biasbinder", "danielle_dupes", "kpop_kiosk"][i % 3]])),
      status: "open",
      deadline: "2026-12-01",
    },
    {
      id: "go-2",
      title: "LE SSERAFIM CRAZY lucky draw",
      groupId: "lesserafim",
      bulkSeller: "seoul_swaps",
      cardIds: lsr.map((c) => c.id),
      pricePerCard: 9,
      thresholdPct: 80,
      claims: {},
      status: "open",
      deadline: "2026-12-10",
    },
  ];
}

/** Crowd-sourced fake card database (§22D). */
export const FAKE_CARD_REPORTS = [
  { id: "fk-1", catalogName: "LSRFM Kazuha · UNFORGIVEN Fansign", tells: "Glossy finish, blurry signature, edges too sharp", reports: 14 },
  { id: "fk-2", catalogName: "NJ Hanni · Get Up POB (Weverse Shop)", tells: "Font on back is thicker; colours oversaturated", reports: 9 },
  { id: "fk-3", catalogName: "SKZ Felix · 5-STAR Lucky Draw", tells: "Card thickness 0.2mm thinner, no matte coating", reports: 21 },
  { id: "fk-4", catalogName: "IVE Wonyoung · I've MINE Album", tells: "Corner radius larger than official template", reports: 6 },
];

/** Glossary for new collectors (§1L). */
export const GLOSSARY: { term: string; meaning: string }[] = [
  { term: "PC", meaning: "Photocard — the collectible card inside albums and merch." },
  { term: "POB", meaning: "Pre-order benefit — an extra card from a specific store for pre-ordering." },
  { term: "BST / WTS / WTT / WTB", meaning: "Buy-sell-trade / want to sell / want to trade / want to buy." },
  { term: "ISO", meaning: "In search of — a card you're hunting for." },
  { term: "DWAYOR", meaning: "Deal with at your own risk — a scam warning about another account." },
  { term: "GO / GOM", meaning: "Group order / group order manager who splits a bulk purchase." },
  { term: "Nugu", meaning: "A lesser-known group — great for cheap, rare finds." },
  { term: "Stamped vs tracked", meaning: "Stamped = cheap letter mail, no tracking. Tracked = parcel with tracking." },
  { term: "Toploader", meaning: "Rigid plastic sleeve that protects a card in the mail." },
  { term: "Proofs", meaning: "Screenshots/videos of past trades that show you're trustworthy." },
];

export const TRADING_TUTORIAL = [
  "Build your wishlist from the database so we can match you automatically.",
  "Add duplicates to your collection — one tap lists them for trade.",
  "Send a trade request: pick which of your cards to offer, add a top-up if needed.",
  "When accepted, buy the label in-app and pack with a sleeve + toploader + cardboard.",
  "Mark the trade received — your collection and wishlist update automatically.",
  "Leave a review. Proofs and reviews build your seller badges.",
];

/** Starter kit for brand-new collectors (§1K). */
export const SUPPLIES_BUNDLE_URL = "https://www.amazon.com/s?k=kpop+photocard+toploader+sleeves+bubble+mailer";
export const DISCORD_URL = "https://discord.gg/winkpop";
