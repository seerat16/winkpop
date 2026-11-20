import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { REGISTERED_EMAILS } from "./community";
import { pruneExpiredCart, round2 } from "./commerce";
import type { SavedSearch, User } from "./types";

/**
 * Local-first user/session store. Persists to AsyncStorage, which works
 * identically on iOS, Android, and Web (localStorage under the hood).
 *
 * This is the seam where a real auth/profile backend (e.g. Supabase) plugs in:
 * swap the body of `login`/`signup` to call the API, keep the same shape.
 */

/** Defaults for every profile field, so older persisted users migrate cleanly. */
const PROFILE_DEFAULTS: Omit<
  User,
  | "id"
  | "email"
  | "username"
  | "displayName"
  | "bio"
  | "collectingGroupIds"
  | "completedTransactions"
  | "rating"
  | "verifiedSeller"
> = {
  likesIds: [],
  cartIds: [],
  wishlistIds: [],
  collectionIds: [],
  country: "US",
  location: "New York, NY",
  currency: "USD",
  language: "English",
  internationalTrading: true,
  paymentMethods: ["wallet", "card"],
  availability: "available",
  aboutMe: "",
  socials: {},
  instagramLinked: false,
  collectingMembers: {},
  priorityGroupIds: [],
  isPrivate: false,
  isCollectionAccount: false,
  newCollector: false,
  onboarded: true,
  memberSince: 2026,
  following: [],
  followers: [],
  followRequests: [],
  blocked: [],
  closeFriends: [],
  savedIds: [],
  recentlyViewedIds: [],
  savedSearches: [],
  followedGroupIds: [],
  cartAddedAt: {},
  collectionQty: {},
  collectionCost: {},
  walletBalance: 0,
  pendingBalance: 0,
  points: 0,
  coupons: [],
  strikes: 0,
  donationSubscription: false,
  premium: false,
  offAppSpend: 0,
  hideCollectionCost: false,
  listingsPerRow: 2,
  darkMode: false,
  feedScope: "global",
  likeAddsToCart: false,
  notificationPrefs: {
    wishlist: true,
    trades: true,
    offers: true,
    orders: true,
    social: true,
    groups: true,
    domesticOnly: false,
  },
};

export const DEFAULT_USER: User = {
  ...PROFILE_DEFAULTS,
  id: "demo-user",
  email: "demo@winkpop.app",
  username: "winkdemo",
  displayName: "Wink Demo",
  bio: "Collecting since 2023 ·  5th gen GG main",
  collectingGroupIds: ["newjeans", "ive", "lesserafim"],
  completedTransactions: 42,
  rating: 4.9,
  verifiedSeller: false,
  avatarColor: "#C9A8E0",
  aboutMe: "Rules: payment within 24h · no holds over 3 days · proofs in highlights 💜",
  socials: { instagram: "winkdemo.pcs", tiktok: "winkdemo" },
  link: "https://linktr.ee/winkdemo",
  collectingMembers: { newjeans: [], ive: ["ive-wonyoung", "ive-rei"], lesserafim: ["lsrfm-kazuha"] },
  priorityGroupIds: ["ive"],
  memberSince: 2023,
  following: ["pcfairy", "biasbinder", "seoul_swaps"],
  followers: ["pcfairy", "karina_kollects", "biasbinder"],
  followRequests: ["carat_cafe"],
  shipping: { domesticStamped: 1.25, domesticTracked: 4.75, intlTracked: 13, freeShipping: false },
  address: { line1: "123 Wink St", city: "New York", region: "NY", country: "US", zip: "10001" },
  walletBalance: 48.5,
  pendingBalance: 12,
  points: 320,
  coupons: ["WINK10"],
  closeFriends: ["pcfairy"],
  collectionIds: ["pc-1", "pc-2", "pc-7", "pc-41", "pc-60", "pc-9", "pc-3"],
  collectionQty: { "pc-1": 2, "pc-7": 3 },
  collectionCost: { "pc-1": 6, "pc-2": 9.5 },
  followedGroupIds: ["lesserafim"],
};

/** Back-fill any fields missing from a persisted (older) user record. */
export function withDefaults(u: Partial<User> & Pick<User, "id" | "email">): User {
  return {
    ...PROFILE_DEFAULTS,
    username: u.email.split("@")[0],
    displayName: u.email.split("@")[0],
    bio: "",
    collectingGroupIds: [],
    completedTransactions: 0,
    rating: 0,
    verifiedSeller: false,
    ...u,
    notificationPrefs: { ...PROFILE_DEFAULTS.notificationPrefs, ...(u.notificationPrefs ?? {}) },
  } as User;
}

interface Result {
  success: boolean;
  error?: string;
}

interface UserState {
  user: User | null;
  hydrated: boolean;
  setHydrated: () => void;
  login: (email: string, password: string) => Result;
  signup: (email: string, password: string) => Result;
  loginWithProvider: (provider: "google" | "instagram") => void;
  requestPasswordReset: (email: string) => Result;
  loginDemo: () => void;
  logout: () => void;
  setCollectingGroups: (ids: string[]) => void;
  toggleLike: (cardId: string) => void;
  toggleCart: (cardId: string) => void;
  toggleWishlist: (cardId: string) => void;
  toggleCollection: (cardId: string) => void;
  updateProfile: (patch: Partial<Pick<User, "displayName" | "username" | "bio">>) => void;

  /** Generic patch for any profile/preference field. */
  updateUser: (patch: Partial<User>) => void;
  /** Set members for a group; empty = full group. `null` removes the group (§24). */
  setCollectingMembers: (groupId: string, memberIds: string[] | null) => void;
  togglePriorityGroup: (groupId: string) => void;
  toggleFollow: (username: string, isPrivate?: boolean) => void;
  respondFollowRequest: (username: string, accept: boolean) => void;
  toggleBlock: (username: string) => void;
  toggleSave: (cardId: string) => void;
  addToCart: (cardIds: string[]) => void;
  removeFromCart: (cardIds: string[]) => void;
  pruneCart: (now?: Date) => number;
  addRecentlyViewed: (cardId: string) => void;
  addToCollection: (cardIds: string[], cost?: number) => void;
  setCollectionQty: (cardId: string, qty: number) => void;
  removeFromCollection: (cardIds: string[]) => void;
  saveSearch: (s: Omit<SavedSearch, "id">) => void;
  removeSavedSearch: (id: string) => void;
  toggleFollowGroup: (groupId: string) => void;
  spendWallet: (amount: number) => Result;
  creditWallet: (amount: number, pending?: boolean) => void;
  releasePending: (amount: number) => void;
  transferBalance: (amount: number) => Result;
  addPoints: (n: number) => void;
  redeemPoints: (n: number, couponCode: string) => Result;
  addStrike: () => void;
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      /** Apply `fn` to the signed-in user (no-op when signed out). */
      const patch = (fn: (u: User) => Partial<User>) => {
        const u = get().user;
        if (u) set({ user: { ...u, ...fn(u) } });
      };

      return {
        user: null,
        hydrated: false,
        setHydrated: () => set({ hydrated: true }),

        login: (email) => {
          const trimmed = email.trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            return { success: false, error: "Please enter a valid email address." };
          }
          set({ user: { ...DEFAULT_USER, email: trimmed } });
          return { success: true };
        },

        signup: (email) => {
          const trimmed = email.trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            return { success: false, error: "Please enter a valid email address." };
          }
          if (REGISTERED_EMAILS.has(trimmed)) {
            return { success: false, error: "That email is already registered — try logging in." };
          }
          set({
            user: withDefaults({
              id: `user-${Date.now()}`,
              email: trimmed,
              username: trimmed.split("@")[0],
              displayName: trimmed.split("@")[0],
              memberSince: new Date().getFullYear(),
              onboarded: false,
              walletBalance: 0,
              coupons: ["FIRSTTRADE"],
            }),
          });
          return { success: true };
        },

        loginWithProvider: (provider) => {
          set({
            user: {
              ...DEFAULT_USER,
              email: `${provider}@winkpop.app`,
              instagramLinked: provider === "instagram" || DEFAULT_USER.instagramLinked,
            },
          });
        },

        requestPasswordReset: (email) => {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return { success: false, error: "Enter the email you signed up with." };
          }
          return { success: true };
        },

        loginDemo: () => set({ user: { ...DEFAULT_USER } }),
        logout: () => set({ user: null }),

        setCollectingGroups: (ids) =>
          patch((u) => ({
            collectingGroupIds: ids,
            collectingMembers: Object.fromEntries(ids.map((id) => [id, u.collectingMembers?.[id] ?? []])),
          })),

        toggleLike: (cardId) =>
          patch((u) => {
            const liking = !u.likesIds.includes(cardId);
            const addCart = liking && u.likeAddsToCart && !u.cartIds.includes(cardId);
            return {
              likesIds: toggle(u.likesIds, cardId),
              ...(addCart
                ? {
                    cartIds: [...u.cartIds, cardId],
                    cartAddedAt: { ...u.cartAddedAt, [cardId]: new Date().toISOString() },
                  }
                : {}),
            };
          }),
        toggleCart: (cardId) =>
          patch((u) => {
            const adding = !u.cartIds.includes(cardId);
            const cartAddedAt = { ...(u.cartAddedAt ?? {}) };
            if (adding) cartAddedAt[cardId] = new Date().toISOString();
            else delete cartAddedAt[cardId];
            return { cartIds: toggle(u.cartIds, cardId), cartAddedAt };
          }),
        toggleWishlist: (cardId) => patch((u) => ({ wishlistIds: toggle(u.wishlistIds, cardId) })),
        toggleCollection: (cardId) => patch((u) => ({ collectionIds: toggle(u.collectionIds, cardId) })),

        updateProfile: (p) => patch(() => p),
        updateUser: (p) => patch(() => p),

        setCollectingMembers: (groupId, memberIds) =>
          patch((u) => {
            const members = { ...(u.collectingMembers ?? {}) };
            let groups = u.collectingGroupIds;
            if (memberIds === null) {
              delete members[groupId];
              groups = groups.filter((g) => g !== groupId);
            } else {
              members[groupId] = memberIds;
              if (!groups.includes(groupId)) groups = [...groups, groupId];
            }
            return { collectingMembers: members, collectingGroupIds: groups };
          }),
        togglePriorityGroup: (groupId) => patch((u) => ({ priorityGroupIds: toggle(u.priorityGroupIds, groupId) })),

        toggleFollow: (username, isPrivate) =>
          patch((u) => {
            if (u.following.includes(username)) return { following: u.following.filter((x) => x !== username) };
            // Private accounts get a request instead (§15A); we auto-approve in the mock after the tap.
            return { following: isPrivate ? u.following : [...u.following, username] };
          }),
        respondFollowRequest: (username, accept) =>
          patch((u) => ({
            followRequests: u.followRequests.filter((x) => x !== username),
            followers: accept && !u.followers.includes(username) ? [...u.followers, username] : u.followers,
          })),
        toggleBlock: (username) =>
          patch((u) => ({
            blocked: toggle(u.blocked, username),
            following: u.following.filter((x) => x !== username),
          })),

        toggleSave: (cardId) => patch((u) => ({ savedIds: toggle(u.savedIds, cardId) })),
        addToCart: (ids) =>
          patch((u) => {
            const now = new Date().toISOString();
            const fresh = ids.filter((id) => !u.cartIds.includes(id));
            return {
              cartIds: [...u.cartIds, ...fresh],
              cartAddedAt: { ...u.cartAddedAt, ...Object.fromEntries(fresh.map((id) => [id, now])) },
            };
          }),
        removeFromCart: (ids) =>
          patch((u) => {
            const cartAddedAt = { ...u.cartAddedAt };
            ids.forEach((id) => delete cartAddedAt[id]);
            return { cartIds: u.cartIds.filter((id) => !ids.includes(id)), cartAddedAt };
          }),
        pruneCart: (now) => {
          const u = get().user;
          if (!u) return 0;
          const kept = pruneExpiredCart(u.cartIds, u.cartAddedAt ?? {}, now);
          const removed = u.cartIds.length - kept.length;
          if (removed > 0) set({ user: { ...u, cartIds: kept } });
          return removed;
        },
        addRecentlyViewed: (cardId) =>
          patch((u) => ({
            recentlyViewedIds: [cardId, ...(u.recentlyViewedIds ?? []).filter((x) => x !== cardId)].slice(0, 20),
          })),

        addToCollection: (ids, cost) =>
          patch((u) => {
            const qty = { ...u.collectionQty };
            const costs = { ...u.collectionCost };
            const collectionIds = [...u.collectionIds];
            for (const id of ids) {
              if (collectionIds.includes(id)) qty[id] = (qty[id] ?? 1) + 1;
              else collectionIds.push(id);
              if (cost != null) costs[id] = cost;
            }
            return { collectionIds, collectionQty: qty, collectionCost: costs };
          }),
        setCollectionQty: (cardId, n) =>
          patch((u) => {
            if (n <= 0) {
              const qty = { ...u.collectionQty };
              delete qty[cardId];
              return { collectionIds: u.collectionIds.filter((x) => x !== cardId), collectionQty: qty };
            }
            return { collectionQty: { ...u.collectionQty, [cardId]: n } };
          }),
        removeFromCollection: (ids) =>
          patch((u) => {
            const qty = { ...u.collectionQty };
            const collectionIds = [...u.collectionIds];
            for (const id of ids) {
              const q = qty[id] ?? 1;
              if (q > 1) qty[id] = q - 1;
              else {
                delete qty[id];
                const i = collectionIds.indexOf(id);
                if (i >= 0) collectionIds.splice(i, 1);
              }
            }
            return { collectionIds, collectionQty: qty };
          }),

        saveSearch: (s) =>
          patch((u) => ({ savedSearches: [{ ...s, id: `ss-${Date.now()}` }, ...u.savedSearches] })),
        removeSavedSearch: (id) => patch((u) => ({ savedSearches: u.savedSearches.filter((s) => s.id !== id) })),
        toggleFollowGroup: (groupId) => patch((u) => ({ followedGroupIds: toggle(u.followedGroupIds, groupId) })),

        spendWallet: (amount) => {
          const u = get().user;
          if (!u) return { success: false, error: "Not signed in." };
          if (u.walletBalance + 1e-9 < amount) return { success: false, error: "Not enough wallet balance." };
          set({ user: { ...u, walletBalance: round2(u.walletBalance - amount) } });
          return { success: true };
        },
        creditWallet: (amount, pending) =>
          patch((u) =>
            pending
              ? { pendingBalance: round2(u.pendingBalance + amount) }
              : { walletBalance: round2(u.walletBalance + amount) },
          ),
        releasePending: (amount) =>
          patch((u) => {
            const a = Math.min(amount, u.pendingBalance);
            return { pendingBalance: round2(u.pendingBalance - a), walletBalance: round2(u.walletBalance + a) };
          }),
        transferBalance: (amount) => {
          const u = get().user;
          if (!u) return { success: false, error: "Not signed in." };
          if (!(amount > 0)) return { success: false, error: "Enter an amount." };
          if (amount > u.walletBalance) return { success: false, error: "Amount exceeds your available balance." };
          set({ user: { ...u, walletBalance: round2(u.walletBalance - amount) } });
          return { success: true };
        },
        addPoints: (n) => patch((u) => ({ points: u.points + n })),
        redeemPoints: (n, couponCode) => {
          const u = get().user;
          if (!u) return { success: false };
          if (u.points < n) return { success: false, error: "Not enough points yet." };
          set({ user: { ...u, points: u.points - n, coupons: [...u.coupons, couponCode] } });
          return { success: true };
        },
        addStrike: () => patch((u) => ({ strikes: u.strikes + 1 })),
      };
    },
    {
      name: "winkpop-user",
      storage: createJSONStorage(() => AsyncStorage),
      // Flip `hydrated` once persisted state has been read back from storage.
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      // `partialize` keeps the persisted payload to just the user record.
      partialize: (state) => ({ user: state.user }),
      // Older persisted records predate the newer profile fields — back-fill them.
      merge: (persisted, current) => {
        const p = persisted as { user?: User | null } | undefined;
        return { ...current, user: p?.user ? withDefaults(p.user) : null };
      },
    },
  ),
);
