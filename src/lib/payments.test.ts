import { describe, expect, it } from "vitest";
import { isBackendConfigured } from "./backend";
import { confirmDelivery, isLiveListingId, startCheckout, startPayoutOnboarding } from "./payments";

describe("payments in demo mode (no Supabase keys)", () => {
  it("reports the backend as not configured", () => {
    expect(isBackendConfigured()).toBe(false);
  });

  it("falls back to the local checkout without calling the network", async () => {
    expect(await startCheckout(["pc-1"])).toEqual({ demo: true });
    expect(await startPayoutOnboarding()).toEqual({ demo: true });
    expect(await confirmDelivery("x")).toEqual({ demo: true });
  });

  it("only treats UUID listings as payable for real", () => {
    expect(isLiveListingId("pc-12")).toBe(false);
    expect(isLiveListingId("3f2b1c9e-8a7d-4e6f-9b0a-1c2d3e4f5a6b")).toBe(true);
  });
});
