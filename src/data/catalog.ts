import { GROUPS, GROUP_MAP } from "./groups";
import { PHOTOCARDS } from "./photocards";
import type {
  CardType,
  CatalogCard,
  CatalogCategory,
  Group,
  Member,
  Photocard,
  VisualAttributes,
} from "./types";

/**
 * The photocard database (§3).
 *
 * Every listing in the marketplace is tagged against one canonical
 * `CatalogCard`, which gives each card a standardized name (§3P) and lets the
 * app treat two listings as "the same card" for price tracking, wishlist
 * matching and trade matching. Organised group → member → era → type, with
 * album versions and POB stores (§3B–F).
 */

export const POB_STORES = [
  "Weverse Shop",
  "Soundwave",
  "Makestar",
  "Ktown4u",
  "Apple Music",
  "Withmuu",
  "Tower Records JP",
];
const ALBUM_VERSIONS = ["Ver. A", "Ver. B", "Digipack", "Photobook", "Jewel"];
const MD_SUBTYPES = ["Official MD", "Collab", "Season's Greetings", "Fanclub", "Fan meeting", "Concert"];

const HAIR = ["black", "brown", "blonde", "pink", "silver", "red", "blue"];
const OUTFITS = ["school uniform", "denim", "hoodie", "suit", "dress", "stage outfit", "pajamas"];
const BACKGROUNDS = ["white", "pastel pink", "sky blue", "outdoor", "studio", "bedroom", "cafe"];
const PROPS = ["none", "flower", "heart hands", "plushie", "sunglasses", "peace sign", "cake"];
const LIGHTING = ["soft", "flash", "golden hour", "neon", "natural"];

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Maps a card type onto the three database categories (§3C). */
export function categoryForType(type: CardType): CatalogCategory {
  if (type === "Album") return "Album";
  if (type === "POB" || type === "Fansign" || type === "Lucky Draw") return "Pre-order Benefit";
  return "Non-album / MD";
}

export function catalogIdFor(memberId: string, era: string, type: CardType): string {
  return `cat-${memberId}-${slug(era)}-${slug(type)}`;
}

/** The catalog id a marketplace listing is tagged to. */
export function catalogIdForListing(card: Pick<Photocard, "memberId" | "era" | "type">): string {
  return catalogIdFor(card.memberId, card.era, card.type);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], n: number): T {
  return arr[n % arr.length];
}

/** Standardized card name used everywhere a card is shown (§0, §3P). */
export function standardName(
  group: Pick<Group, "abbr">,
  memberName: string,
  era: string,
  type: CardType,
  version: string,
): string {
  return `${group.abbr} ${memberName} · ${era} ${type} (${version})`;
}

function buildCard(group: Group, member: Member, era: string, type: CardType): CatalogCard {
  const id = catalogIdFor(member.id, era, type);
  const h = hash(id);
  const category = categoryForType(type);
  const store = category === "Pre-order Benefit" ? pick(POB_STORES, h) : undefined;
  const version =
    category === "Album"
      ? pick(ALBUM_VERSIONS, h >> 3)
      : category === "Pre-order Benefit"
        ? (store ?? "POB")
        : type === "MD"
          ? pick(MD_SUBTYPES, h >> 2)
          : type;
  const region: CatalogCard["region"] =
    store === "Tower Records JP" ? "Japanese" : h % 11 === 0 ? "Chinese" : h % 5 === 0 ? "Japanese" : "Korean";
  const attributes: VisualAttributes = {
    hair: pick(HAIR, h),
    outfit: pick(OUTFITS, h >> 4),
    background: pick(BACKGROUNDS, h >> 6),
    props: pick(PROPS, h >> 8),
    lighting: pick(LIGHTING, h >> 10),
  };
  return {
    id,
    groupId: group.id,
    groupName: group.name,
    memberId: member.id,
    memberName: member.name,
    era,
    type,
    category,
    version,
    store,
    region,
    name: standardName(group, member.name, era, type, version),
    description: `${member.name} with ${attributes.hair} hair in a ${attributes.outfit}, ${attributes.background} background${attributes.props !== "none" ? `, ${attributes.props}` : ""}.`,
    attributes,
    isNew: era === group.eras[0],
    imgSeed: (h % 9000) + 1000,
  };
}

function buildCatalog(): CatalogCard[] {
  const out = new Map<string, CatalogCard>();
  const BASE_TYPES: CardType[] = ["Album", "POB", "MD"];

  for (const group of GROUPS) {
    for (const member of group.members) {
      // Former members only get cards from their final era.
      const eras = member.former ? group.eras.slice(-1) : group.eras;
      for (const era of eras) {
        for (const type of BASE_TYPES) {
          const c = buildCard(group, member, era, type);
          out.set(c.id, c);
        }
      }
    }
  }
  // Every marketplace listing must resolve to a database entry.
  for (const card of PHOTOCARDS) {
    const id = catalogIdForListing(card);
    if (!out.has(id)) {
      const group = GROUP_MAP[card.groupId];
      const member = group.members.find((m) => m.id === card.memberId)!;
      out.set(id, buildCard(group, member, card.era, card.type));
    }
  }
  return [...out.values()];
}

export const CATALOG: CatalogCard[] = buildCatalog();
export const CATALOG_MAP: Record<string, CatalogCard> = Object.fromEntries(
  CATALOG.map((c) => [c.id, c]),
);

export function getCatalogCard(id: string): CatalogCard | undefined {
  return CATALOG_MAP[id];
}

/** All marketplace listings of a database card (active sellers/traders, §3V). */
export function listingsForCatalog(catalogId: string, listings: Photocard[] = PHOTOCARDS): Photocard[] {
  return listings.filter((l) => catalogIdForListing(l) === catalogId);
}

export interface CatalogFilters {
  query?: string;
  groupId?: string;
  memberId?: string;
  era?: string;
  category?: CatalogCategory;
  type?: CardType;
  region?: CatalogCard["region"];
  version?: string;
  onlyNew?: boolean;
}

/**
 * Database search across member, group, era, title, type, version,
 * description, category and visual attributes (§3G, §4Z).
 */
export function searchCatalog(filters: CatalogFilters, all: CatalogCard[] = CATALOG): CatalogCard[] {
  const { query, groupId, memberId, era, category, type, region, version, onlyNew } = filters;
  let cards = all;
  if (groupId && groupId !== "all") cards = cards.filter((c) => c.groupId === groupId);
  if (memberId && memberId !== "all") cards = cards.filter((c) => c.memberId === memberId);
  if (era && era !== "all") cards = cards.filter((c) => c.era === era);
  if (category) cards = cards.filter((c) => c.category === category);
  if (type) cards = cards.filter((c) => c.type === type);
  if (region) cards = cards.filter((c) => c.region === region);
  if (version) cards = cards.filter((c) => c.version === version);
  if (onlyNew) cards = cards.filter((c) => c.isNew);
  if (query && query.trim()) {
    const terms = query.trim().toLowerCase().split(/\s+/);
    cards = cards.filter((c) => {
      const hay = [
        c.name,
        c.memberName,
        c.groupName,
        c.era,
        c.type,
        c.version,
        c.category,
        c.description,
        ...Object.values(c.attributes),
      ]
        .join(" ")
        .toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  return cards;
}

/** Album → era → version → member tree used by the database browser (§3D–F). */
export function catalogTree(groupId: string, category: CatalogCategory) {
  const cards = searchCatalog({ groupId, category });
  const tree: Record<string, Record<string, CatalogCard[]>> = {};
  for (const c of cards) {
    const top = category === "Non-album / MD" ? c.region : c.era;
    const sub = category === "Pre-order Benefit" ? (c.store ?? c.version) : c.version;
    tree[top] ??= {};
    tree[top][sub] ??= [];
    tree[top][sub].push(c);
  }
  return tree;
}

/**
 * Mock "scan a card" identification (§3N). A real implementation would run an
 * image-embedding model against the template database; here we match on the
 * typed hint so the flow is exercisable end to end.
 */
export function identifyCard(hint: string): CatalogCard | undefined {
  const results = searchCatalog({ query: hint });
  return results[0];
}
