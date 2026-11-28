import { GROUPS } from "./groups";
import {
  CARD_TYPES,
  type CardType,
  type Condition,
  type ListingIntent,
  type Photocard,
} from "./types";

const CONDITIONS: Condition[] = ["Mint", "Near Mint", "Good", "Damaged"];
const INTENTS: ListingIntent[] = ["sale", "trade", "both"];
const SELLERS = [
  "pcfairy",
  "biasbinder",
  "seoul_swaps",
  "kpop_kiosk",
  "winkvault",
  "danielle_dupes",
];

/**
 * Small deterministic pseudo-random generator so the catalogue is identical on
 * every run (stable snapshots, predictable tests) without pulling in a dep.
 */
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function priceForType(type: CardType, rand: () => number): number {
  const base: Record<CardType, [number, number]> = {
    Album: [3, 12],
    POB: [8, 30],
    Fansign: [40, 160],
    Broadcast: [25, 90],
    "Season's Greetings": [10, 40],
    Collab: [6, 25],
    MD: [5, 20],
    "Lucky Draw": [30, 120],
  };
  const [min, max] = base[type];
  return Math.round((min + rand() * (max - min)) * 100) / 100;
}

/**
 * Build the marketplace catalogue: for every group × member × era we generate
 * a couple of listings of varied type/condition/price.
 */
function buildPhotocards(): Photocard[] {
  const cards: Photocard[] = [];
  let seedCounter = 1;

  for (const group of GROUPS) {
    for (const member of group.members) {
      if (member.former) continue;
      for (const era of group.eras) {
        const rand = seeded(seedCounter * 7919);
        const count = 1 + Math.floor(rand() * 2); // 1–2 listings per combo
        for (let i = 0; i < count; i++) {
          const type = CARD_TYPES[Math.floor(rand() * CARD_TYPES.length)];
          const condition = CONDITIONS[Math.floor(rand() * CONDITIONS.length)];
          const intent = INTENTS[Math.floor(rand() * INTENTS.length)];
          const damaged = condition === "Damaged";
          const available = rand() > 0.12;
          cards.push({
            id: `pc-${seedCounter}`,
            groupId: group.id,
            groupName: group.name,
            memberId: member.id,
            memberName: member.name,
            era,
            title: `${member.name} ${era} ${type}`,
            type,
            condition,
            price: priceForType(type, rand),
            intent,
            available,
            damaged,
            popularity: Math.round(rand() * 1000),
            sellerUsername: SELLERS[Math.floor(rand() * SELLERS.length)],
            imgSeed: seedCounter,
          });
          seedCounter++;
        }
      }
    }
  }
  return cards;
}

export const PHOTOCARDS: Photocard[] = buildPhotocards();

export const PHOTOCARD_MAP: Record<string, Photocard> = Object.fromEntries(
  PHOTOCARDS.map((c) => [c.id, c]),
);

export function getPhotocard(id: string): Photocard | undefined {
  return PHOTOCARD_MAP[id];
}
