/**
 * Server-side pricing — the source of truth for what a buyer is charged.
 * Mirrors src/data/commerce.ts (bundle discounts, coupons, 5% buyer fee,
 * zero seller fees). All amounts are integer cents.
 */
export const BUYER_FEE_RATE = 0.05;

export function bundleDiscountRate(cardsFromSeller: number): number {
  if (cardsFromSeller >= 5) return 0.15;
  if (cardsFromSeller >= 3) return 0.1;
  if (cardsFromSeller === 2) return 0.05;
  return 0;
}

const COUPONS: Record<string, { pct?: number; flatCents?: number; waiveFee?: boolean }> = {
  WINK10: { pct: 0.1 },
  FIRSTTRADE: { waiveFee: true },
  WELCOME5: { flatCents: 500 },
};

export interface SellerQuote {
  sellerId: string;
  items: { listingId: string; priceCents: number; title: string }[];
  subtotalCents: number;
  discountCents: number; // bundle + share of coupon
  buyerFeeCents: number;
  sellerPayoutCents: number; // what the seller receives (no seller fee)
}

export function quote(
  items: { listingId: string; sellerId: string; priceCents: number; title: string }[],
  coupon?: string,
): { sellers: SellerQuote[]; totalCents: number } {
  const c = coupon ? COUPONS[coupon.toUpperCase()] : undefined;
  if (coupon && !c) throw new Error("That code isn't valid.");
  const bySeller = new Map<string, typeof items>();
  for (const it of items) bySeller.set(it.sellerId, [...(bySeller.get(it.sellerId) ?? []), it]);

  const sellers: SellerQuote[] = [];
  for (const [sellerId, list] of bySeller) {
    const subtotal = list.reduce((s, i) => s + i.priceCents, 0);
    const bundle = Math.round(subtotal * bundleDiscountRate(list.length));
    sellers.push({
      sellerId,
      items: list.map(({ listingId, priceCents, title }) => ({ listingId, priceCents, title })),
      subtotalCents: subtotal,
      discountCents: bundle,
      buyerFeeCents: 0,
      sellerPayoutCents: subtotal - bundle,
    });
  }
  // Coupons are funded by WinKPop (they reduce the buyer's price, not the seller's payout).
  const afterBundle = sellers.reduce((s, q) => s + q.subtotalCents - q.discountCents, 0);
  let couponCents = 0;
  if (c?.pct) couponCents = Math.round(afterBundle * c.pct);
  if (c?.flatCents) couponCents = Math.min(afterBundle, c.flatCents);
  const charged = afterBundle - couponCents;
  const fee = c?.waiveFee ? 0 : Math.round(charged * BUYER_FEE_RATE);
  // Spread the coupon and fee across sellers proportionally (for order records).
  let feeLeft = fee;
  let couponLeft = couponCents;
  sellers.forEach((q, i) => {
    const share = afterBundle ? (q.subtotalCents - q.discountCents) / afterBundle : 0;
    const last = i === sellers.length - 1;
    const f = last ? feeLeft : Math.round(fee * share);
    const cp = last ? couponLeft : Math.round(couponCents * share);
    feeLeft -= f;
    couponLeft -= cp;
    q.buyerFeeCents = f;
    q.discountCents += cp;
  });
  return { sellers, totalCents: charged + fee };
}
