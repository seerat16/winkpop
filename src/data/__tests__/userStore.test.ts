import { useUserStore } from "../userStore";

describe("userStore", () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, hydrated: true });
  });

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

  it("creates a fresh account on signup (no seeded stats)", () => {
    useUserStore.getState().signup("new@winkpop.app", "pw");
    const user = useUserStore.getState().user!;
    expect(user.username).toBe("new");
    expect(user.completedTransactions).toBe(0);
    expect(user.collectingGroupIds).toEqual([]);
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

  it("updates collecting groups", () => {
    useUserStore.getState().loginDemo();
    useUserStore.getState().setCollectingGroups(["ive", "twice"]);
    expect(useUserStore.getState().user?.collectingGroupIds).toEqual(["ive", "twice"]);
  });

  it("clears the user on logout", () => {
    useUserStore.getState().loginDemo();
    useUserStore.getState().logout();
    expect(useUserStore.getState().user).toBeNull();
  });
});
