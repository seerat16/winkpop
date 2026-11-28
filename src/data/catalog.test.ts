import { describe, it, expect } from "vitest";
import { CATALOG, catalogIdForListing, categoryForType, getCatalogCard, identifyCard, searchCatalog } from "./catalog";
import { GROUP_MAP } from "./groups";
import { PHOTOCARDS } from "./photocards";

describe("photocard database", () => {
  it("tags every marketplace listing to a database card", () => {
    for (const p of PHOTOCARDS) expect(getCatalogCard(catalogIdForListing(p))).toBeTruthy();
  });

  it("gives each card a standardized name with group, member, era and type", () => {
    const c = CATALOG.find((x) => x.memberName === "Hanni" && x.era === "OMG" && x.type === "Album")!;
    expect(c.name).toMatch(/^NJ Hanni · OMG Album \(/);
  });

  it("maps types onto the three database categories", () => {
    expect(categoryForType("Album")).toBe("Album");
    expect(categoryForType("POB")).toBe("Pre-order Benefit");
    expect(categoryForType("Fansign")).toBe("Pre-order Benefit");
    expect(categoryForType("Season's Greetings")).toBe("Non-album / MD");
  });

  it("only gives former members cards from their final era", () => {
    const garam = CATALOG.filter((c) => c.memberId === "lsrfm-garam");
    const lastEra = GROUP_MAP.lesserafim.eras[GROUP_MAP.lesserafim.eras.length - 1];
    expect(garam.length).toBeGreaterThan(0);
    expect(garam.every((c) => c.era === lastEra)).toBe(true);
  });

  it("searches by visual attributes and every query term", () => {
    const sample = CATALOG[10];
    const res = searchCatalog({ query: `${sample.memberName} ${sample.attributes.hair}` });
    expect(res.some((c) => c.id === sample.id)).toBe(true);
    expect(res.every((c) => c.name.includes(sample.memberName) || c.description.includes(sample.memberName))).toBe(true);
  });

  it("identifies a scanned card from a hint", () => {
    expect(identifyCard("Karina Whiplash")?.memberName).toBe("Karina");
  });
});
