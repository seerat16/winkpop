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
