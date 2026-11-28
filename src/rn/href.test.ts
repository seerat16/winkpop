import { describe, expect, it } from "vitest";
import { normalizeHref } from "./href";

describe("normalizeHref", () => {
  it("drops expo-style route groups", () => {
    expect(normalizeHref("/(tabs)/home")).toBe("/home");
    expect(normalizeHref("/(auth)/onboarding")).toBe("/onboarding");
    expect(normalizeHref("/(tabs)/transactions?tab=buying")).toBe("/transactions?tab=buying");
  });
  it("leaves normal paths alone", () => {
    expect(normalizeHref("/card/pc-1")).toBe("/card/pc-1");
  });
});
