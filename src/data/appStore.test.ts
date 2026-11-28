import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore, allListings } from "./appStore";
import { catalogIdForListing } from "./catalog";
import { PHOTOCARDS } from "./photocards";
import { useUserStore } from "./userStore";

describe("appStore", () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, hydrated: true });
    useUserStore.getState().loginDemo();
    useAppStore.getState().reset();
  });

  it("creates a listing owned by the user and shows it first in the marketplace", () => {
    const l = useAppStore.getState().createListing({
      groupId: "ive",
      groupName: "IVE",
      memberId: "ive-rei",
      memberName: "Rei",
      era: "ELEVEN",
      type: "Album",
      title: "Rei ELEVEN",
      condition: "Mint",
      damaged: false,
      intent: "sale",
      price: 6,
      description: "",
      hashtags: [],
      slides: [],
      shippingMethods: [],
      freeShipping: false,
      smartPricing: false,
      bundle: false,
    });
    expect(l.sellerUsername).toBe("winkdemo");
    expect(allListings()[0].id).toBe(l.id);
  });

  it("refuses wallet checkout when the balance is too low", () => {
    useUserStore.getState().updateUser({ walletBalance: 1 });
    const r = useAppStore.getState().checkout([PHOTOCARDS[0].id], { payment: "wallet" });
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/balance/);
  });

  it("checks out: one order per seller, cart cleared, card marked sold", () => {
    const [a, b] = PHOTOCARDS;
    useUserStore.getState().addToCart([a.id, b.id]);
    const r = useAppStore.getState().checkout([a.id, b.id], { payment: "card" });
    expect(r.success).toBe(true);
    const sellers = new Set([a.sellerUsername, b.sellerUsername]).size;
    expect(r.orderIds).toHaveLength(sellers);
    expect(useUserStore.getState().user?.cartIds).toEqual([]);
    expect(allListings().find((l) => l.id === a.id)?.available).toBe(false);
  });

  it("requires at least one card to purchase", () => {
    expect(useAppStore.getState().checkout([], { payment: "card" }).error).toMatch(/at least one/);
  });

  it("completing a trade updates collection and wishlist automatically", () => {
    const give = PHOTOCARDS[1].id;
    const get = PHOTOCARDS.find((p) => p.groupId === "ive")!;
    useUserStore.getState().addToCollection([give]);
    const wl = useAppStore.getState().createWishlist({ name: "t", groupId: "ive", cardIds: [catalogIdForListing(get)], descriptions: [], priority: false, level: "low", showOnProfile: false });
    useAppStore.getState().requestTrade({ partner: "pcfairy", myCardIds: [give], theirCardIds: [get.id], topUp: 0, ratio: "1:1", wishlistMatch: true });
    const t = useAppStore.getState().trades[0];
    useAppStore.getState().completeTrade(t.id);
    const u = useUserStore.getState().user!;
    expect(u.collectionIds).toContain(get.id);
    expect(useAppStore.getState().wishlists.find((w) => w.id === wl)?.cardIds).toEqual([]);
  });

  it("offers open a DM with the seller", () => {
    const c = PHOTOCARDS[3];
    useAppStore.getState().makeOffer(c.id, 4);
    expect(useAppStore.getState().offers[0]).toMatchObject({ cardId: c.id, amount: 4, status: "pending" });
    const conv = useAppStore.getState().conversations.find((x) => x.participants.includes(c.sellerUsername) && !x.isGroup);
    expect(conv?.messages.some((m) => m.kind === "offer")).toBe(true);
  });

  it("confirms a group order once the claim threshold is met", () => {
    const go = useAppStore.getState().groupOrders[0];
    const unclaimed = go.cardIds.filter((c) => !go.claims[c]);
    unclaimed.slice(0, 1).forEach((c) => useAppStore.getState().claimGroupOrder(go.id, c));
    expect(useAppStore.getState().groupOrders[0].status).toBe("confirmed");
  });

  it("awards points for database submissions", () => {
    const before = useUserStore.getState().user!.points;
    const pts = useAppStore.getState().submitToDatabase({ kind: "template", groupName: "ILLIT", memberName: "Wonhee", era: "SUPER REAL ME", description: "" });
    expect(pts).toBe(50);
    expect(useUserStore.getState().user!.points).toBe(before + 50);
  });

  it("supports comments with replies, likes and deletion", () => {
    const store = useAppStore.getState();
    store.addComment({ postId: "post-2" }, "Hi!");
    const c = useAppStore.getState().posts.find((p) => p.id === "post-2")!.comments[0];
    store.addComment({ postId: "post-2" }, "reply", c.id);
    store.toggleCommentLike({ postId: "post-2" }, c.id);
    expect(useAppStore.getState().posts.find((p) => p.id === "post-2")!.comments[0].likes).toContain("winkdemo");
    store.deleteComment({ postId: "post-2" }, c.id);
    expect(useAppStore.getState().posts.find((p) => p.id === "post-2")!.comments).toHaveLength(0);
  });
});
