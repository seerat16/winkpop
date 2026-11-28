import { describe, expect, it } from "vitest";
import { getPriceHistory, getPriceStats } from "./priceHistory";
import { PHOTOCARDS } from "./photocards";

describe("price intelligence", () => {
  const sampleId = PHOTOCARDS[0].id;

  it("returns a 12-point history for a known card", () => {
    const history = getPriceHistory(sampleId);
    expect(history).toHaveLength(12);
    history.forEach((p) => {
      expect(p.price).toBeGreaterThan(0);
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
  it("is deterministic across calls", () => {
    expect(getPriceHistory(sampleId)).toEqual(getPriceHistory(sampleId));
  });
  it("returns empty for an unknown card", () => {
    expect(getPriceHistory("nope")).toEqual([]);
    expect(getPriceStats("nope")).toBeNull();
  });
  it("computes low <= avg <= high", () => {
    const s = getPriceStats(sampleId)!;
    expect(s.low).toBeLessThanOrEqual(s.avg);
    expect(s.avg).toBeLessThanOrEqual(s.high);
  });
});
