import { getPhotocard } from "./photocards";
import type { PriceHistoryPoint } from "./types";

/**
 * Price intelligence layer — the "StockX for photocards" the research flagged
 * as the single biggest unmet need (a complete market gap).
 *
 * Generates a deterministic 12-point sold-price series per card, trending
 * around the listing price. A real backend would compute this from completed
 * transactions instead.
 */
export function getPriceHistory(cardId: string): PriceHistoryPoint[] {
  const card = getPhotocard(cardId);
  if (!card) return [];

  const points: PriceHistoryPoint[] = [];
  const now = new Date();
  let value = card.price * 1.15;

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    // Deterministic wobble seeded by the card + month index.
    const wobble = Math.sin((card.imgSeed + i) * 1.3) * card.price * 0.12;
    value = Math.max(1, value * 0.99 + wobble);
    points.push({
      date: d.toISOString().slice(0, 10),
      price: Math.round(value * 100) / 100,
    });
  }
  return points;
}

export interface PriceStats {
  low: number;
  avg: number;
  high: number;
  last: number;
}

export function getPriceStats(cardId: string): PriceStats | null {
  const history = getPriceHistory(cardId);
  if (history.length === 0) return null;
  const prices = history.map((p) => p.price);
  return {
    low: Math.min(...prices),
    high: Math.max(...prices),
    avg: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
    last: prices[prices.length - 1],
  };
}
