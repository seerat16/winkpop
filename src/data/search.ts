import { catalogIdForListing, categoryForType, getCatalogCard } from "./catalog";
import type { CardType, CatalogCategory, Photocard } from "./types";

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
  /** Database category: Album / Pre-order Benefit / Non-album / MD. */
  category?: CatalogCategory;
  condition?: Photocard["condition"];
  intent?: Photocard["intent"];
  sellerUsername?: string;
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
    category,
    condition,
    intent,
    sellerUsername,
    sort = "popular",
  } = filters;

  let cards = all;

  if (groupId && groupId !== "all") cards = cards.filter((c) => c.groupId === groupId);
  if (memberId && memberId !== "all") cards = cards.filter((c) => c.memberId === memberId);
  if (era && era !== "all") cards = cards.filter((c) => c.era === era);
  if (types && types.length > 0) cards = cards.filter((c) => types.includes(c.type));
  if (hideOutOfStock) cards = cards.filter((c) => c.available);
  if (category) cards = cards.filter((c) => categoryForType(c.type) === category);
  if (condition) cards = cards.filter((c) => c.condition === condition);
  if (intent) cards = cards.filter((c) => c.intent === intent || c.intent === "both");
  if (sellerUsername) cards = cards.filter((c) => c.sellerUsername === sellerUsername);
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
        c.type.toLowerCase().includes(q) ||
        catalogText(c).includes(q),
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

/** Database text for a listing (version, category, description, hashtags) for search (§4Z). */
function catalogText(c: Photocard): string {
  const cat = getCatalogCard(catalogIdForListing(c));
  const tags = (c as Photocard & { hashtags?: string[]; description?: string }).hashtags ?? [];
  const desc = (c as Photocard & { description?: string }).description ?? "";
  return [cat?.version, cat?.category, cat?.description, cat?.name, desc, ...tags].join(" ").toLowerCase();
}
