import type { CardType, Photocard } from "./types";

export type SortKey = "popular" | "new" | "price_asc" | "price_desc";

export interface SearchFilters {
  query?: string;
  groupId?: string; // "all" or undefined = any
  memberId?: string;
  era?: string;
  types?: CardType[];
  minPrice?: number;
  maxPrice?: number;
  hideOutOfStock?: boolean;
  sort?: SortKey;
}

/**
 * The core photocard-native search. Pure function (no side effects) so it is
 * trivially unit-testable and reusable on every platform.
 *
 * Research context: "No platform filters by group + member + era + card type"
 * was the single largest qualitative complaint (26% of respondents).
 */
export function searchPhotocards(all: Photocard[], filters: SearchFilters): Photocard[] {
  const {
    query,
    groupId,
    memberId,
    era,
    types,
    minPrice,
    maxPrice,
    hideOutOfStock,
    sort = "popular",
  } = filters;

  let cards = all;

  if (groupId && groupId !== "all") cards = cards.filter((c) => c.groupId === groupId);
  if (memberId && memberId !== "all") cards = cards.filter((c) => c.memberId === memberId);
  if (era && era !== "all") cards = cards.filter((c) => c.era === era);
  if (types && types.length > 0) cards = cards.filter((c) => types.includes(c.type));
  if (hideOutOfStock) cards = cards.filter((c) => c.available);
  if (typeof minPrice === "number") cards = cards.filter((c) => c.price >= minPrice);
  if (typeof maxPrice === "number") cards = cards.filter((c) => c.price <= maxPrice);

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    cards = cards.filter(
      (c) =>
        c.memberName.toLowerCase().includes(q) ||
        c.groupName.toLowerCase().includes(q) ||
        c.era.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q),
    );
  }

  const sorted = [...cards];
  switch (sort) {
    case "popular":
      sorted.sort((a, b) => b.popularity - a.popularity);
      break;
    case "new":
      sorted.sort((a, b) => b.imgSeed - a.imgSeed);
      break;
    case "price_asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
  }
  return sorted;
}
