/**
 * Core domain model for WinKPop.
 *
 * These types are the contract between the data layer and the UI. The mock
 * data layer implements them today; a Supabase (or other) backend can swap in
 * later without changing screen code, as long as it returns these shapes.
 */

/** A photocard "type" — mirrors the categories in the product research docs. */
export type CardType =
  | "Album"
  | "POB" // pre-order benefit
  | "Fansign"
  | "Broadcast"
  | "Season's Greetings"
  | "Collab"
  | "MD" // official merchandise
  | "Lucky Draw";

export const CARD_TYPES: CardType[] = [
  "Album",
  "POB",
  "Fansign",
  "Broadcast",
  "Season's Greetings",
  "Collab",
  "MD",
  "Lucky Draw",
];

/** Condition flag shown on listings. */
export type Condition = "Mint" | "Near Mint" | "Good" | "Damaged";

/** How a card is offered. */
export type ListingIntent = "sale" | "trade" | "both";

export interface Member {
  id: string;
  name: string;
  /** Accent color for chips/avatars. */
  color: string;
  former?: boolean;
  /** Note shown for former members, e.g. departure year (§4FF). */
  note?: string;
}

export interface Group {
  id: string;
  name: string;
  abbr: string;
  company: string;
  debutYear: number;
  generation: 2 | 3 | 4 | 5;
  gender: "girl" | "boy";
  color: string;
  members: Member[];
  /** Comeback eras, newest first. */
  eras: string[];
}

/** A catalogued photocard listing in the marketplace. */
export interface Photocard {
  id: string;
  groupId: string;
  groupName: string;
  memberId: string;
  memberName: string;
  era: string;
  title: string;
  type: CardType;
  condition: Condition;
  price: number;
  intent: ListingIntent;
  available: boolean;
  damaged: boolean;
  /** Relative popularity used for the "Popular" sort. */
  popularity: number;
  sellerUsername: string;
  /** Deterministic seed used to generate a stable placeholder image. */
  imgSeed: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  /** Group ids the user currently collects. */
  collectingGroupIds: string[];
  likesIds: string[];
  cartIds: string[];
  wishlistIds: string[];
  collectionIds: string[];
  completedTransactions: number;
  rating: number;
  verifiedSeller: boolean;

  /* --- profile (§1, §23) --- */
  avatarColor?: string;
  /** Local image uri for an uploaded profile photo. */
  avatarUri?: string;
  bannerColor?: string;
  age?: number;
  phone?: string;
  country: string;
  location: string;
  currency: string;
  language: string;
  internationalTrading: boolean;
  address?: Address;
  paymentMethods: PaymentMethod[];
  shipping?: ShippingOptions;
  availability: Availability;
  aboutMe: string;
  link?: string;
  socials: { instagram?: string; tiktok?: string; youtube?: string };
  /** Members per collected group; empty array = full group (§24D). */
  collectingMembers: Record<string, string[]>;
  priorityGroupIds: string[];
  isPrivate: boolean;
  isCollectionAccount: boolean;
  newCollector: boolean;
  /** False until the signup onboarding flow is finished. */
  onboarded: boolean;
  memberSince: number;

  /* --- social graph --- */
  following: string[];
  followers: string[];
  followRequests: string[];
  blocked: string[];
  closeFriends: string[];

  /* --- marketplace --- */
  savedIds: string[];
  recentlyViewedIds: string[];
  savedSearches: SavedSearch[];
  followedGroupIds: string[];
  /** cardId -> ISO date the card was added (cart auto-expires after 30 days). */
  cartAddedAt: Record<string, string>;
  /** cardId -> quantity owned (>1 = duplicates). */
  collectionQty: Record<string, number>;
  /** cardId -> price paid, for collection cost tracking. */
  collectionCost: Record<string, number>;
  walletBalance: number;
  pendingBalance: number;
  points: number;
  coupons: string[];
  strikes: number;
  donationSubscription: boolean;
  premium: boolean;
  spendingLimit?: number;
  offAppSpend: number;

  /* --- preferences --- */
  hideCollectionCost: boolean;
  listingsPerRow: 1 | 2 | 3;
  darkMode: boolean;
  feedScope: "global" | "domestic";
  /** Spec §7A option: liking a listing also drops it in the cart. */
  likeAddsToCart: boolean;
  notificationPrefs: {
    wishlist: boolean;
    trades: boolean;
    offers: boolean;
    orders: boolean;
    social: boolean;
    groups: boolean;
    /** Smart-match filters (§9Q). */
    maxPrice?: number;
    domesticOnly: boolean;
    currency?: string;
    paymentMethod?: PaymentMethod;
  };
}

/** A sold-price data point powering the StockX-style price intelligence. */
export interface PriceHistoryPoint {
  date: string; // ISO date
  price: number;
}

export type TransactionKind = "buy" | "sell" | "trade";
export type TransactionStatus =
  "pending" | "paid" | "shipped" | "delivered" | "completed" | "disputed";

export interface Transaction {
  id: string;
  kind: TransactionKind;
  cardId: string;
  cardTitle: string;
  counterpartyUsername: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string; // ISO date
}

/* ------------------------------------------------------------------------- */
/* Photocard database (catalog)                                              */
/* ------------------------------------------------------------------------- */

/** The three top-level database categories from the spec (§3C). */
export type CatalogCategory = "Album" | "Pre-order Benefit" | "Non-album / MD";
export const CATALOG_CATEGORIES: CatalogCategory[] = ["Album", "Pre-order Benefit", "Non-album / MD"];

/** Visual attributes used for attribute search (§3G). */
export interface VisualAttributes {
  hair: string;
  outfit: string;
  background: string;
  props: string;
  lighting: string;
}

/** A canonical photocard in the database — the thing listings are tagged against. */
export interface CatalogCard {
  id: string;
  groupId: string;
  groupName: string;
  memberId: string;
  memberName: string;
  era: string;
  type: CardType;
  category: CatalogCategory;
  /** Album version (e.g. "Ver. A") or POB store (e.g. "Weverse Shop"). */
  version: string;
  /** For POB cards: the store that ran the benefit. */
  store?: string;
  /** Korean / Japanese / Chinese release region (POB + MD sub-segmentation). */
  region: "Korean" | "Japanese" | "Chinese";
  /** Standardized name shared by every listing of this card (§3P). */
  name: string;
  description: string;
  attributes: VisualAttributes;
  /** True for newest-era cards (powers the New Releases section). */
  isNew: boolean;
  imgSeed: number;
  /** Community-submitted entry (earns points). */
  submittedBy?: string;
}

/* ------------------------------------------------------------------------- */
/* Users, profiles & reputation                                              */
/* ------------------------------------------------------------------------- */

export type Availability = "available" | "busy" | "vacation" | "cant_ship";
export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: "Available",
  busy: "Busy — slow replies",
  vacation: "Vacation mode",
  cant_ship: "Can't ship right now",
};

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  country: string;
  zip: string;
}

/** Four individually-priced shipping options; undefined = not offered (§19A). */
export interface ShippingOptions {
  domesticStamped?: number;
  domesticTracked?: number;
  intlStamped?: number;
  intlTracked?: number;
  freeShipping: boolean;
}
export type ShippingMethod = keyof Omit<ShippingOptions, "freeShipping">;
export const SHIPPING_METHOD_LABELS: Record<ShippingMethod, string> = {
  domesticStamped: "Domestic stamped",
  domesticTracked: "Domestic tracked",
  intlStamped: "International stamped",
  intlTracked: "International tracked",
};

export type PaymentMethod =
  | "wallet"
  | "apple_pay"
  | "google_pay"
  | "klarna"
  | "paypal"
  | "card"
  | "venmo"
  | "zelle";
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  wallet: "WinKPop Wallet",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  klarna: "Klarna",
  paypal: "PayPal",
  card: "Credit / debit card",
  venmo: "Venmo",
  zelle: "Zelle",
};

export interface SavedSearch {
  id: string;
  label: string;
  query: string;
  groupId?: string;
  memberId?: string;
  era?: string;
  notify: boolean;
}

/** A community member (seed data for sellers, followers, DMs). */
export interface CommunityUser {
  username: string;
  displayName: string;
  country: string;
  location: string;
  bio: string;
  verified: boolean;
  completedTransactions: number;
  memberSince: number;
  avgShipDays: number;
  avgResponseHours: number;
  proofs: number;
  followers: string[];
  following: string[];
  collectingGroupIds: string[];
  internationalTrading: boolean;
  isPrivate: boolean;
  isCollectionAccount: boolean;
  availability: Availability;
  shipping: ShippingOptions;
  avatarColor: string;
  online: boolean;
  lastActive: string;
}

export type ReviewTag = "Quick shipper" | "Good communication" | "Friendly" | "Great packaging";
export const REVIEW_TAGS: ReviewTag[] = [
  "Quick shipper",
  "Good communication",
  "Friendly",
  "Great packaging",
];

export interface Review {
  id: string;
  subject: string; // username being reviewed
  reviewer: string;
  reviewerCountry: string;
  stars: 1 | 2 | 3 | 4 | 5;
  role: "purchase" | "sale" | "trade";
  cardTitle: string;
  text: string;
  tags: ReviewTag[];
  date: string;
  auto?: boolean;
}

/* ------------------------------------------------------------------------- */
/* Listings                                                                  */
/* ------------------------------------------------------------------------- */

export type TradeRatio = "1:1" | "1:n" | "n:1" | "1:1 + top-up";
export const TRADE_RATIOS: TradeRatio[] = ["1:1", "1:n", "n:1", "1:1 + top-up"];

export interface TradePreference {
  mode: "wishlist" | "specific";
  /** Catalog ids the seller will accept (specific mode). */
  cardIds: string[];
  /** If set, the card is locked to trade only for this catalog card (§9L). */
  lockCardId?: string;
  ratio: TradeRatio;
}

export type ListingStatus = "active" | "inactive" | "hold" | "sold";

/** One photo/slide in a listing; each slide can carry its own price/caption (§6JJ). */
export interface ListingSlide {
  id: string;
  imgSeed: number;
  catalogId?: string;
  price?: number;
  caption?: string;
  condition?: Condition;
}

/** A listing created by the signed-in user (seed listings are `Photocard`). */
export interface UserListing extends Photocard {
  catalogId?: string;
  description: string;
  hashtags: string[];
  slides: ListingSlide[];
  tradePref?: TradePreference;
  shippingMethods: ShippingMethod[];
  freeShipping: boolean;
  smartPricing: boolean;
  status: ListingStatus;
  promoted: boolean;
  bundle: boolean;
  createdAt: string;
  stats: { likes: number; saves: number; views: number; carts: number };
}

/* ------------------------------------------------------------------------- */
/* Social                                                                     */
/* ------------------------------------------------------------------------- */

export type PostType =
  | "ISO"
  | "DWAYOR"
  | "Collection Drop"
  | "Collection Display"
  | "Art"
  | "Other";
export const POST_TYPES: PostType[] = [
  "ISO",
  "DWAYOR",
  "Collection Drop",
  "Collection Display",
  "Art",
  "Other",
];

export interface Comment {
  id: string;
  author: string;
  text: string;
  at: string;
  likes: string[];
  pinned?: boolean;
  parentId?: string;
}

export interface GroupTag {
  groupId: string;
  /** Empty = all members. */
  memberIds: string[];
}

export interface PostMedia {
  id: string;
  seed: number;
  kind: "photo" | "video";
  text?: string;
}

export interface Post {
  id: string;
  author: string;
  type: PostType;
  media: PostMedia[];
  link?: string;
  caption: string;
  groupTags: GroupTag[];
  accountTags: string[];
  hashtags: string[];
  location?: string;
  song?: string;
  createdAt: string;
  likes: string[];
  savedBy: string[];
  comments: Comment[];
  commentsOff: boolean;
  hideLikes: boolean;
  archived: boolean;
  collabWith?: string;
  repostOf?: string;
  community?: "local" | "display" | "art";
}

export interface Story {
  id: string;
  author: string;
  seed: number;
  text?: string;
  song?: string;
  filter?: string;
  createdAt: string;
  viewers: string[];
  likedBy: string[];
  closeFriends: boolean;
  hiddenFrom: string[];
  archived: boolean;
  taggedAccounts: string[];
}

export interface Highlight {
  id: string;
  owner: string;
  title: string;
  coverSeed: number;
  storyIds: string[];
}

/* ------------------------------------------------------------------------- */
/* Messaging                                                                  */
/* ------------------------------------------------------------------------- */

export type ConversationCategory = "sale" | "trade" | "purchase" | "community";
export type MessageKind = "text" | "voice" | "photo" | "video" | "listing" | "post" | "offer" | "profile";

export interface ChatMessage {
  id: string;
  from: string;
  kind: MessageKind;
  text?: string;
  refId?: string;
  at: string;
  likedBy: string[];
  replyToId?: string;
  readBy: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  isGroup: boolean;
  name?: string;
  owner?: string;
  category: ConversationCategory;
  dealStatus: "pending" | "completed";
  folder?: string;
  pinned: boolean;
  muted: boolean;
  markedUnread: boolean;
  flagged: boolean;
  isRequest: boolean;
  messages: ChatMessage[];
}

/* ------------------------------------------------------------------------- */
/* Commerce: offers, trades, orders                                           */
/* ------------------------------------------------------------------------- */

export type OfferStatus = "pending" | "countered" | "accepted" | "declined";
export interface Offer {
  id: string;
  cardId: string;
  direction: "sent" | "received";
  counterparty: string;
  amount: number;
  counterAmount?: number;
  status: OfferStatus;
  createdAt: string;
}

export type TradeStatus = "pending" | "accepted" | "declined" | "shipped" | "completed" | "cancelled";
export interface TradeRequest {
  id: string;
  direction: "incoming" | "outgoing";
  partner: string;
  /** Listing/card ids I give. */
  myCardIds: string[];
  /** Listing/card ids I receive. */
  theirCardIds: string[];
  topUp: number;
  ratio: TradeRatio;
  status: TradeStatus;
  createdAt: string;
  wishlistMatch: boolean;
  labelPaid?: boolean;
  authenticate?: boolean;
}

export type OrderStatus = "pending" | "in_transit" | "delivered" | "completed";
export const ORDER_STEPS = ["Paid", "Label created", "Shipped", "In transit", "Delivered", "Completed"];

export interface Order {
  id: string;
  kind: TransactionKind;
  cardIds: string[];
  cardTitle: string;
  counterparty: string;
  amount: number;
  fee: number;
  status: OrderStatus;
  /** Index into ORDER_STEPS. */
  step: number;
  shippingMethod: ShippingMethod;
  trackingNumber: string;
  createdAt: string;
  reviewed: boolean;
  paymentMethod?: PaymentMethod;
  proofVideo?: boolean;
  authenticated?: boolean;
  groupId: string;
}

/* ------------------------------------------------------------------------- */
/* Collection & wishlists                                                     */
/* ------------------------------------------------------------------------- */

export type PriorityLevel = "low" | "medium" | "high";
export type WishlistTag = "WTB" | "WTT" | "ISO";

export interface Wishlist {
  id: string;
  name: string;
  groupId: string;
  /** Catalog card ids. */
  cardIds: string[];
  /** Free-text entries when no card photo exists, e.g. "Any Karina photocard". */
  descriptions: string[];
  priority: boolean;
  level: PriorityLevel;
  tag?: WishlistTag;
  folder?: string;
  showOnProfile: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------------- */
/* Notifications, safety, points                                              */
/* ------------------------------------------------------------------------- */

export type NotificationKind =
  | "wishlist_match"
  | "smart_trade"
  | "smart_sale"
  | "group"
  | "offer"
  | "order"
  | "follow"
  | "comment"
  | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  text: string;
  at: string;
  read: boolean;
  href?: string;
}

export type ReportReason = "Scam / DWAYOR" | "Fake card" | "Not as described" | "Harassment" | "Spam" | "Other";
export const REPORT_REASONS: ReportReason[] = [
  "Scam / DWAYOR",
  "Fake card",
  "Not as described",
  "Harassment",
  "Spam",
  "Other",
];

export interface Report {
  id: string;
  targetKind: "listing" | "user" | "post" | "message";
  targetId: string;
  reason: ReportReason;
  details: string;
  at: string;
}

export interface DatabaseSubmission {
  id: string;
  kind: "scan" | "template" | "group" | "image_update";
  groupName: string;
  memberName: string;
  era: string;
  description: string;
  at: string;
  status: "pending" | "approved";
  points: number;
}

export interface GroupOrder {
  id: string;
  title: string;
  groupId: string;
  bulkSeller: string;
  gom?: string;
  cardIds: string[];
  pricePerCard: number;
  thresholdPct: number;
  claims: Record<string, string>; // cardId -> username
  status: "open" | "confirmed" | "shipped";
  deadline: string;
}
