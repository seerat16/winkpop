import { describe, expect, it } from "vitest";
import { inviteCode, inviteLink } from "./invites";

describe("invites", () => {
  it("gives each user a stable code", () => {
    expect(inviteCode("winkdemo")).toBe(inviteCode("winkdemo"));
    expect(inviteCode("winkdemo")).not.toBe(inviteCode("pcfairy"));
    expect(inviteCode("winkdemo")).toMatch(/^WINK[0-9A-Z]{3}$/);
  });

  it("builds a shareable link", () => {
    expect(inviteLink("winkdemo")).toBe(`https://winkpop.app/i/${inviteCode("winkdemo")}`);
  });
});
