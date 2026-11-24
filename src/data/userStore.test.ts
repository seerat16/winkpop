import { beforeEach, describe, expect, it } from "vitest";
import { useUserStore } from "./userStore";

describe("userStore", () => {
  it("rejects an invalid email on login", () => {
    const result = useUserStore.getState().login("not-an-email", "pw");
    expect(result.success).toBe(false);
    expect(useUserStore.getState().user).toBeNull();
  });
  it("logs in with a valid email", () => {
    const result = useUserStore.getState().login("fan@winkpop.app", "pw");
    expect(result.success).toBe(true);
    expect(useUserStore.getState().user?.email).toBe("fan@winkpop.app");
  });
  it("creates a fresh account on signup", () => {
    useUserStore.getState().signup("new@winkpop.app", "pw");
    const u = useUserStore.getState().user!;
    expect(u.username).toBe("new");
    expect(u.completedTransactions).toBe(0);
    expect(u.collectingGroupIds).toEqual([]);
  });
  it("toggles cart / likes / wishlist / collection idempotently", () => {
    useUserStore.getState().loginDemo();
    const { toggleCart, toggleLike, toggleWishlist, toggleCollection } = useUserStore.getState();
    toggleCart("pc-1");
    expect(useUserStore.getState().user?.cartIds).toContain("pc-1");
    toggleCart("pc-1");
    expect(useUserStore.getState().user?.cartIds).not.toContain("pc-1");
    toggleLike("pc-2");
    toggleWishlist("pc-3");
    toggleCollection("pc-4");
    const u = useUserStore.getState().user!;
    expect(u.likesIds).toContain("pc-2");
    expect(u.wishlistIds).toContain("pc-3");
    expect(u.collectionIds).toContain("pc-4");
  });
  it("updates collecting groups and logs out", () => {
    useUserStore.getState().loginDemo();
    useUserStore.getState().setCollectingGroups(["ive", "twice"]);
    expect(useUserStore.getState().user?.collectingGroupIds).toEqual(["ive", "twice"]);
    useUserStore.getState().logout();
    expect(useUserStore.getState().user).toBeNull();
  });
});

describe("userStore — profile, collection & wallet", () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, hydrated: true });
    useUserStore.getState().loginDemo();
  });

  it("rejects signup with an already-registered email", () => {
    useUserStore.setState({ user: null });
    expect(useUserStore.getState().signup("taken@winkpop.app", "pw").error).toMatch(/already registered/);
  });

  it("tracks duplicates when the same card is added twice", () => {
    const { addToCollection, removeFromCollection } = useUserStore.getState();
    addToCollection(["pc-99"]);
    addToCollection(["pc-99"]);
    expect(useUserStore.getState().user?.collectionQty["pc-99"]).toBe(2);
    removeFromCollection(["pc-99"]);
    expect(useUserStore.getState().user?.collectionIds).toContain("pc-99");
    removeFromCollection(["pc-99"]);
    expect(useUserStore.getState().user?.collectionIds).not.toContain("pc-99");
  });

  it("full group vs individual members on the collecting list", () => {
    const { setCollectingMembers } = useUserStore.getState();
    setCollectingMembers("aespa", []);
    expect(useUserStore.getState().user?.collectingGroupIds).toContain("aespa");
    setCollectingMembers("aespa", ["aespa-karina"]);
    expect(useUserStore.getState().user?.collectingMembers.aespa).toEqual(["aespa-karina"]);
    setCollectingMembers("aespa", null);
    expect(useUserStore.getState().user?.collectingGroupIds).not.toContain("aespa");
  });

  it("guards wallet transfers and spending", () => {
    const bal = useUserStore.getState().user!.walletBalance;
    expect(useUserStore.getState().transferBalance(bal + 1).success).toBe(false);
    expect(useUserStore.getState().transferBalance(5).success).toBe(true);
    expect(useUserStore.getState().user!.walletBalance).toBeCloseTo(bal - 5);
  });

  it("records when cart items were added so they can expire", () => {
    useUserStore.getState().toggleCart("pc-5");
    expect(useUserStore.getState().user?.cartAddedAt["pc-5"]).toBeTruthy();
    useUserStore.getState().updateUser({ cartAddedAt: { "pc-5": "2020-01-01T00:00:00Z" } });
    expect(useUserStore.getState().pruneCart()).toBe(1);
    expect(useUserStore.getState().user?.cartIds).not.toContain("pc-5");
  });

  it("optionally adds liked listings to the cart", () => {
    useUserStore.getState().updateUser({ likeAddsToCart: true });
    useUserStore.getState().toggleLike("pc-6");
    expect(useUserStore.getState().user?.cartIds).toContain("pc-6");
  });
});
