import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "./types";

/**
 * Local-first user/session store. Persists to AsyncStorage, which works
 * identically on iOS, Android, and Web (localStorage under the hood).
 *
 * This is the seam where a real auth/profile backend (e.g. Supabase) plugs in:
 * swap the body of `login`/`signup` to call the API, keep the same shape.
 */

const DEFAULT_USER: User = {
  id: "demo-user",
  email: "demo@winkpop.app",
  username: "winkdemo",
  displayName: "Wink Demo",
  bio: "Collecting since 2023 ·  5th gen GG main",
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
  hydrated: boolean;
  setHydrated: () => void;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (email: string, password: string) => { success: boolean; error?: string };
  loginDemo: () => void;
  logout: () => void;
  setCollectingGroups: (ids: string[]) => void;
  toggleLike: (cardId: string) => void;
  toggleCart: (cardId: string) => void;
  toggleWishlist: (cardId: string) => void;
  toggleCollection: (cardId: string) => void;
  updateProfile: (patch: Partial<Pick<User, "displayName" | "username" | "bio">>) => void;
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
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
        set({
          user: {
            ...DEFAULT_USER,
            email: trimmed,
            username: trimmed.split("@")[0],
            displayName: trimmed.split("@")[0],
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

      toggleLike: (cardId) => {
        const u = get().user;
        if (u) set({ user: { ...u, likesIds: toggle(u.likesIds, cardId) } });
      },
      toggleCart: (cardId) => {
        const u = get().user;
        if (u) set({ user: { ...u, cartIds: toggle(u.cartIds, cardId) } });
      },
      toggleWishlist: (cardId) => {
        const u = get().user;
        if (u) set({ user: { ...u, wishlistIds: toggle(u.wishlistIds, cardId) } });
      },
      toggleCollection: (cardId) => {
        const u = get().user;
        if (u) set({ user: { ...u, collectionIds: toggle(u.collectionIds, cardId) } });
      },

      updateProfile: (patch) => {
        const u = get().user;
        if (u) set({ user: { ...u, ...patch } });
      },
    }),
    {
      name: "winkpop-user",
      storage: createJSONStorage(() => AsyncStorage),
      // Flip `hydrated` once persisted state has been read back from storage.
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      // `partialize` keeps the persisted payload to just the user record.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
