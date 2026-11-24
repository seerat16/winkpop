import { describe, it, expect } from "vitest";
import {
  bundleDiscountRate,
  collectionStats,
  customsFees,
  extractHashtags,
  hasShippingSetup,
  isValidUrl,
  offeredShipping,
  priceCart,
  pruneExpiredCart,
  recommend,
  roundToIncrement,
  sellerEarnings,
  shippingSummary,
  similarListings,
  validateAge,
  validateListing,
  validateUsername,
} from "./commerce";
import { PHOTOCARDS } from "./photocards";
import type { Photocard } from "./types";

const card = (o: Partial<Photocard>): Photocard => ({
  ...PHOTOCARDS[0],
  id: "x",
  price: 10,
  sellerUsername: "a",
  ...o,
});

describe("pricing rules", () => {
  it("snaps prices to $0.05 increments", () => {
    expect(roundToIncrement(4.12)).toBe(4.1);
    expect(roundToIncrement(4.13)).toBe(4.15);
    expect(roundToIncrement(10)).toBe(10);
  });

  it("charges zero seller fees", () => {
    expect(sellerEarnings(12.5)).toEqual({ fee: 0, earnings: 12.5 });
  });

  it("validates listings: title, $1 minimum, increments, trade cards", () => {
    expect(validateListing({ title: "", intent: "sale", price: 5 })).toMatch(/title/i);
    expect(validateListing({ title: "Card", intent: "sale", price: 0.5 })).toMatch(/at least \$1\.00/);
    expect(validateListing({ title: "Card", intent: "sale", price: 5.03 })).toMatch(/0\.05/);
    expect(validateListing({ title: "Card", intent: "trade", price: 0, tradeMode: "specific", tradeCardCount: 0 })).toMatch(/trade for/);
    expect(validateListing({ title: "Card", intent: "trade", price: 0, tradeMode: "wishlist" })).toBeNull();
    expect(validateListing({ title: "Card", intent: "both", price: 7.25, tradeMode: "wishlist" })).toBeNull();
  });
});

describe("cart pricing", () => {
  it("applies tiered bundle discounts per seller", () => {
    expect(bundleDiscountRate(1)).toBe(0);
    expect(bundleDiscountRate(2)).toBe(0.05);
    expect(bundleDiscountRate(3)).toBe(0.1);
    expect(bundleDiscountRate(5)).toBe(0.15);
  });

  it("adds a 5% service fee after discounts", () => {
    const q = priceCart([card({ id: "1", sellerUsername: "a" }), card({ id: "2", sellerUsername: "b" })]);
    expect(q.subtotal).toBe(20);
    expect(q.bundleDiscount).toBe(0);
    expect(q.serviceFee).toBe(1);
    expect(q.total).toBe(21);
  });

  it("discounts two cards from the same seller by 5%", () => {
    const q = priceCart([card({ id: "1" }), card({ id: "2" })]);
    expect(q.bundleDiscount).toBe(1);
    expect(q.total).toBe(19.95);
  });

  it("supports coupons and rejects unknown codes", () => {
    expect(priceCart([card({})], "WINK10").couponDiscount).toBe(1);
    expect(priceCart([card({})], "FIRSTTRADE").serviceFee).toBe(0);
    expect(priceCart([card({})], "NOPE").couponError).toBeTruthy();
  });

  it("auto-removes cart items older than 30 days", () => {
    const now = new Date("2026-11-20T00:00:00Z");
    const kept = pruneExpiredCart(["old", "new", "legacy"], { old: "2026-10-01T00:00:00Z", new: "2026-11-19T00:00:00Z" }, now);
    expect(kept).toEqual(["new", "legacy"]);
  });
});

describe("shipping", () => {
  it("only offers options with a price", () => {
    const opts = offeredShipping({ domesticStamped: 1, intlTracked: 12, freeShipping: false });
    expect(opts.map((o) => o.method)).toEqual(["domesticStamped", "intlTracked"]);
    expect(hasShippingSetup({ freeShipping: false })).toBe(false);
    expect(hasShippingSetup(undefined)).toBe(false);
  });

  it("free shipping zeroes the price", () => {
    expect(offeredShipping({ domesticTracked: 5, freeShipping: true })[0].price).toBe(0);
  });

  it("summarises shipping for profiles", () => {
    expect(shippingSummary({ domesticStamped: 1, intlStamped: 2, domesticTracked: 4, freeShipping: false })).toBe("stamped ww · tracked dom. only");
  });

  it("estimates Canadian customs", () => {
    expect(customsFees("CA", 30)?.amount).toBe(11.45);
    expect(customsFees("US", 30)).toBeNull();
  });
});

describe("validation", () => {
  it("checks username length, characters and availability", () => {
    const taken = new Set(["pcfairy"]);
    expect(validateUsername("abc", taken)).toMatch(/6/);
    expect(validateUsername("bad name!", taken)).toMatch(/letters/);
    expect(validateUsername("pcfairy", taken)).toMatch(/taken/);
    expect(validateUsername("wink.collector", taken)).toBeNull();
  });

  it("requires users to be 13+", () => {
    expect(validateAge(12)).toMatch(/13/);
    expect(validateAge(13)).toBeNull();
  });

  it("validates links and extracts hashtags", () => {
    expect(isValidUrl("https://winkpop.app/x")).toBe(true);
    expect(isValidUrl("not a link")).toBe(false);
    expect(extractHashtags("ISO #NewJeans and #hanni #newjeans")).toEqual(["newjeans", "hanni"]);
  });
});

describe("collection & recommendations", () => {
  it("counts duplicates, groups and value", () => {
    const ids = [PHOTOCARDS[0].id, PHOTOCARDS[1].id];
    const s = collectionStats(ids, { [PHOTOCARDS[0].id]: 3 });
    expect(s.totalCards).toBe(4);
    expect(s.uniqueCards).toBe(2);
    expect(s.duplicates).toBe(2);
    expect(s.estimatedValue).toBeGreaterThan(0);
  });

  it("recommends cards from collected groups first", () => {
    const recs = recommend({ collectingGroupIds: ["stray-kids"], likesIds: [], cartIds: [], wishlistIds: [], collectingMembers: {} });
    expect(recs[0].groupId).toBe("stray-kids");
  });

  it("finds similar listings in the same group, excluding itself", () => {
    const c = PHOTOCARDS[0];
    const sim = similarListings(c);
    expect(sim.length).toBeGreaterThan(0);
    expect(sim.every((s) => s.groupId === c.groupId && s.id !== c.id)).toBe(true);
  });
});
