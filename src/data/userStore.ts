import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./types";

const DEFAULT_USER: User = {
  id: "demo-user",
  email: "demo@winkpop.app",
  username: "winkdemo",
  displayName: "Wink Demo",
  bio: "Collecting since 2023 · 5th gen GG main",
  collectingGroupIds: ["newjeans", "ive", "lesserafim"],
  likesIds: [],
  cartIds: [],
  wishlistIds: [],
  collectionIds: [],
  completedTransactions: 42,
  rating: 4.9,
  verifiedSeller: false,
};

interface UserState {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (email: string, password: string) => { success: boolean; error?: string };
  loginDemo: () => void;
  logout: () => void;
  setCollectingGroups: (ids: string[]) => void;
  toggleLike: (id: string) => void;
  toggleCart: (id: string) => void;
  toggleWishlist: (id: string) => void;
  toggleCollection: (id: string) => void;
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,

      login: (email) => {
        const e = email.trim().toLowerCase();
        if (!isValidEmail(e))
          return { success: false, error: "Please enter a valid email address." };
        set({ user: { ...DEFAULT_USER, email: e } });
        return { success: true };
      },

      signup: (email) => {
        const e = email.trim().toLowerCase();
        if (!isValidEmail(e))
          return { success: false, error: "Please enter a valid email address." };
        set({
          user: {
            ...DEFAULT_USER,
            email: e,
            username: e.split("@")[0],
            displayName: e.split("@")[0],
            collectingGroupIds: [],
            completedTransactions: 0,
            rating: 0,
          },
        });
        return { success: true };
      },

      loginDemo: () => set({ user: { ...DEFAULT_USER } }),
      logout: () => set({ user: null }),

      setCollectingGroups: (ids) => {
        const u = get().user;
        if (u) set({ user: { ...u, collectingGroupIds: ids } });
      },
      toggleLike: (id) => {
        const u = get().user;
        if (u) set({ user: { ...u, likesIds: toggle(u.likesIds, id) } });
      },
      toggleCart: (id) => {
        const u = get().user;
        if (u) set({ user: { ...u, cartIds: toggle(u.cartIds, id) } });
      },
      toggleWishlist: (id) => {
        const u = get().user;
        if (u) set({ user: { ...u, wishlistIds: toggle(u.wishlistIds, id) } });
      },
      toggleCollection: (id) => {
        const u = get().user;
        if (u) set({ user: { ...u, collectionIds: toggle(u.collectionIds, id) } });
      },
    }),
    { name: "winkpop-user" },
  ),
);
