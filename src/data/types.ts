export type CardType =
  "Album" | "POB" | "Fansign" | "Broadcast" | "Season's Greetings" | "Collab" | "MD" | "Lucky Draw";

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

export type Condition = "Mint" | "Near Mint" | "Good" | "Damaged";
export type ListingIntent = "sale" | "trade" | "both";

export interface Member {
  id: string;
  name: string;
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
  eras: string[];
}

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
  popularity: number;
  sellerUsername: string;
  imgSeed: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  collectingGroupIds: string[];
  likesIds: string[];
  cartIds: string[];
  wishlistIds: string[];
  collectionIds: string[];
  completedTransactions: number;
  rating: number;
  verifiedSeller: boolean;
}

export interface PriceHistoryPoint {
  date: string;
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
  createdAt: string;
}
