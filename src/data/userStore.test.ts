import { describe, expect, it } from "vitest";
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
