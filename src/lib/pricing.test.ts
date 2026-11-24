import { describe, expect, it } from "vitest";
import { priceCart } from "@/data/commerce";
import { PHOTOCARDS } from "@/data/photocards";
import { quote } from "../../supabase/functions/_shared/pricing";

/**
 * The server (Edge Function) decides what a buyer is charged; the app shows a
 * preview. They must agree, or buyers see one total and pay another.
 */
const cents = (n: number) => Math.round(n * 100);

function serverTotal(cards: typeof PHOTOCARDS, coupon?: string) {
  return quote(
    cards.map((c) => ({ listingId: c.id, sellerId: c.sellerUsername, priceCents: cents(c.price), title: c.title })),
    coupon,
  );
}

describe("server pricing matches the in-app cart preview", () => {
  const bySeller = PHOTOCARDS.filter((c) => c.sellerUsername === PHOTOCARDS[0].sellerUsername).slice(0, 5);
  const cases: [string, typeof PHOTOCARDS, string | undefined][] = [
    ["one card", [PHOTOCARDS[0]], undefined],
    ["two sellers", [PHOTOCARDS[0], PHOTOCARDS.find((c) => c.sellerUsername !== PHOTOCARDS[0].sellerUsername)!], undefined],
    ["bundle of 3", bySeller.slice(0, 3), undefined],
    ["bundle of 5", bySeller, undefined],
    ["coupon WINK10", bySeller.slice(0, 2), "WINK10"],
    ["fee waiver", [PHOTOCARDS[0]], "FIRSTTRADE"],
  ];
  for (const [name, cards, coupon] of cases) {
    it(name, () => {
      const client = priceCart(cards, coupon);
      const server = serverTotal(cards, coupon);
      expect(Math.abs(server.totalCents - cents(client.total))).toBeLessThanOrEqual(2); // rounding only
    });
  }

  it("never charges the seller a fee", () => {
    const s = serverTotal(bySeller.slice(0, 2)).sellers[0];
    expect(s.sellerPayoutCents).toBe(s.subtotalCents - Math.round(s.subtotalCents * 0.05));
  });

  it("rejects unknown coupons", () => {
    expect(() => serverTotal([PHOTOCARDS[0]], "FREE100")).toThrow(/isn't valid/);
  });

  it("splits fees across sellers without losing a cent", () => {
    const cards = [PHOTOCARDS[0], PHOTOCARDS[1], PHOTOCARDS[2], PHOTOCARDS[3]];
    const q = serverTotal(cards, "WINK10");
    const sum = q.sellers.reduce((s, x) => s + x.subtotalCents - x.discountCents + x.buyerFeeCents, 0);
    expect(sum).toBe(q.totalCents);
  });
});
