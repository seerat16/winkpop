import { computeBadges, getReviews, isBanned, proofTier, summarizeReviews } from "../community";
import type { Review } from "../types";

describe("reviews & reputation", () => {
  it("summarizes the average and per-star breakdown", () => {
    const mk = (stars: Review["stars"]): Review => ({ id: String(stars), subject: "x", reviewer: "y", reviewerCountry: "US", stars, role: "sale", cardTitle: "c", text: "t", tags: [], date: "2026-01-01" });
    const s = summarizeReviews([mk(5), mk(5), mk(4), mk(1)]);
    expect(s.count).toBe(4);
    expect(s.average).toBe(3.8);
    expect(s.breakdown).toEqual([1, 0, 0, 1, 2]);
  });

  it("generates deterministic reviews for seed sellers", () => {
    expect(getReviews("pcfairy")).toEqual(getReviews("pcfairy"));
    expect(getReviews("pcfairy").length).toBeGreaterThan(0);
  });

  it("awards Verified Seller at 100 completed transactions", () => {
    const ids = (n: number) => computeBadges({ completedTransactions: n, memberSince: 2024 }).map((b) => b.id);
    expect(ids(99)).not.toContain("verified");
    expect(ids(100)).toContain("verified");
  });

  it("tiers proof badges", () => {
    expect(proofTier(10)).toBeNull();
    expect(proofTier(30)?.id).toBe("tier-bronze");
    expect(proofTier(600)?.id).toBe("tier-diamond");
  });

  it("bans at three strikes", () => {
    expect(isBanned(2)).toBe(false);
    expect(isBanned(3)).toBe(true);
  });
});
