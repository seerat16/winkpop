import { describe, expect, it } from "vitest";
import { searchPhotocards } from "./search";
import type { Photocard } from "./types";

function card(overrides: Partial<Photocard>): Photocard {
  return {
    id: "pc-x",
    groupId: "newjeans",
    groupName: "NewJeans",
    memberId: "nj-minji",
    memberName: "Minji",
    era: "Get Up",
    title: "Minji Get Up Album",
    type: "Album",
    condition: "Mint",
    price: 10,
    intent: "sale",
    available: true,
    damaged: false,
    popularity: 500,
    sellerUsername: "pcfairy",
    imgSeed: 1,
    ...overrides,
  };
}

const DATA: Photocard[] = [
  card({
    id: "a",
    memberId: "nj-minji",
    memberName: "Minji",
    era: "Get Up",
    type: "Album",
    price: 5,
    popularity: 900,
  }),
  card({
    id: "b",
    memberId: "nj-hanni",
    memberName: "Hanni",
    era: "OMG",
    type: "POB",
    price: 25,
    popularity: 400,
  }),
  card({
    id: "c",
    groupId: "ive",
    groupName: "IVE",
    memberId: "ive-rei",
    memberName: "Rei",
    era: "LOVE DIVE",
    type: "Fansign",
    price: 120,
    popularity: 700,
    available: false,
  }),
  card({
    id: "d",
    memberId: "nj-haerin",
    memberName: "Haerin",
    era: "Get Up",
    type: "Album",
    price: 8,
    popularity: 100,
  }),
];

describe("searchPhotocards", () => {
  it("returns everything when no filters are applied", () => {
    expect(searchPhotocards(DATA, {})).toHaveLength(4);
  });
  it("filters by group", () => {
    expect(searchPhotocards(DATA, { groupId: "ive" }).map((c) => c.id)).toEqual(["c"]);
  });
  it("treats 'all' as no group filter", () => {
    expect(searchPhotocards(DATA, { groupId: "all" })).toHaveLength(4);
  });
  it("filters by member", () => {
    expect(searchPhotocards(DATA, { memberId: "nj-minji" }).map((c) => c.id)).toEqual(["a"]);
  });
  it("filters by era", () => {
    expect(
      searchPhotocards(DATA, { era: "Get Up" })
        .map((c) => c.id)
        .sort(),
    ).toEqual(["a", "d"]);
  });
  it("filters by card type", () => {
    expect(
      searchPhotocards(DATA, { types: ["POB", "Fansign"] })
        .map((c) => c.id)
        .sort(),
    ).toEqual(["b", "c"]);
  });
  it("filters by price range", () => {
    expect(
      searchPhotocards(DATA, { minPrice: 6, maxPrice: 30 })
        .map((c) => c.id)
        .sort(),
    ).toEqual(["b", "d"]);
  });
  it("hides out-of-stock when requested", () => {
    expect(
      searchPhotocards(DATA, { hideOutOfStock: true }).find((c) => c.id === "c"),
    ).toBeUndefined();
  });
  it("matches free-text query across fields", () => {
    expect(searchPhotocards(DATA, { query: "hanni" }).map((c) => c.id)).toEqual(["b"]);
    expect(searchPhotocards(DATA, { query: "love dive" }).map((c) => c.id)).toEqual(["c"]);
    expect(
      searchPhotocards(DATA, { query: "album" })
        .map((c) => c.id)
        .sort(),
    ).toEqual(["a", "d"]);
  });
  it("sorts by price ascending and descending", () => {
    expect(searchPhotocards(DATA, { sort: "price_asc" }).map((c) => c.price)).toEqual([
      5, 8, 25, 120,
    ]);
    expect(searchPhotocards(DATA, { sort: "price_desc" }).map((c) => c.price)).toEqual([
      120, 25, 8, 5,
    ]);
  });
  it("sorts by popularity for the default sort", () => {
    expect(searchPhotocards(DATA, { sort: "popular" }).map((c) => c.id)).toEqual([
      "a",
      "c",
      "b",
      "d",
    ]);
  });
  it("combines multiple filters", () => {
    expect(
      searchPhotocards(DATA, { groupId: "newjeans", era: "Get Up", types: ["Album"] })
        .map((c) => c.id)
        .sort(),
    ).toEqual(["a", "d"]);
  });
  it("does not mutate the input array", () => {
    const before = DATA.map((c) => c.id);
    searchPhotocards(DATA, { sort: "price_desc" });
    expect(DATA.map((c) => c.id)).toEqual(before);
  });
});
