import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { catalogIdForListing, getCatalogCard } from "./catalog";
import { getCommunityUser } from "./community";
import { AUTH_FEE, BUYER_FEE_RATE, priceCart, round2, TRADE_SERVICE_FEE } from "./commerce";
import { getPhotocard, PHOTOCARDS } from "./photocards";
import {
  ME,
  seedConversations,
  seedGroupOrders,
  seedHighlights,
  seedNotifications,
  seedOffers,
  seedOrders,
  seedPosts,
  seedStories,
  seedTrades,
  seedWishlists,
} from "./seed";
import type {
  AppNotification,
  ChatMessage,
  Comment,
  Conversation,
  ConversationCategory,
  DatabaseSubmission,
  GroupOrder,
  Highlight,
  Offer,
  Order,
  PaymentMethod,
  Photocard,
  Post,
  Report,
  Review,
  ShippingMethod,
  Story,
  TradeRequest,
  UserListing,
  Wishlist,
} from "./types";
import { useUserStore } from "./userStore";

/**
 * App content store: everything that, in production, would live in shared
 * backend tables (listings, posts, stories, chats, offers, trades, orders,
 * wishlists, notifications). Seeded on first run and persisted locally.
 *
 * Actions are deliberately "dumb" — business rules live in the pure modules
 * (`commerce.ts`, `catalog.ts`, `community.ts`) so they stay unit-testable.
 */

/** Stable empty array for store selectors (avoids new references → render loops). */
/** Never mutate it — it is shared. */
export const EMPTY: never[] = [];

let counter = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;
const now = () => new Date().toISOString();
const me = () => useUserStore.getState().user?.username ?? ME;
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export type ListingDraft = Omit<
  UserListing,
  "id" | "createdAt" | "stats" | "status" | "promoted" | "popularity" | "sellerUsername" | "available" | "imgSeed"
> & { imgSeed?: number };

export interface CheckoutResult {
  success: boolean;
  error?: string;
  orderIds?: string[];
}

interface AppState {
  listings: UserListing[];
  soldIds: string[];
  heldIds: string[];
  posts: Post[];
  savedFolders: Record<string, string[]>;
  listingComments: Record<string, Comment[]>;
  stories: Story[];
  highlights: Highlight[];
  conversations: Conversation[];
  offers: Offer[];
  trades: TradeRequest[];
  orders: Order[];
  wishlists: Wishlist[];
  notifications: AppNotification[];
  reviewsWritten: Review[];
  reports: Report[];
  submissions: DatabaseSubmission[];
  groupOrders: GroupOrder[];
  /** Per-user "WTT/WTS/WTB/On the way" marks on database cards (§3S). */
  catalogMarks: Record<string, "WTT" | "WTS" | "WTB" | "On the way">;

  reset: () => void;

  /* listings */
  createListing: (draft: ListingDraft) => UserListing;
  createListings: (drafts: ListingDraft[]) => UserListing[];
  updateListing: (id: string, patch: Partial<UserListing>) => void;
  deleteListing: (id: string) => void;
  setListingStatus: (ids: string[], status: UserListing["status"]) => void;
  setPromoted: (ids: string[], promoted: boolean) => void;
  toggleHold: (id: string) => void;

  /* posts */
  createPost: (p: Omit<Post, "id" | "createdAt" | "likes" | "savedBy" | "comments" | "archived" | "author">) => Post;
  updatePost: (id: string, patch: Partial<Post>) => void;
  deletePost: (id: string) => void;
  toggleLikePost: (id: string) => void;
  toggleSavePost: (id: string, folder?: string) => void;
  createSavedFolder: (name: string) => void;
  renameSavedFolder: (from: string, to: string) => void;
  deleteSavedFolder: (name: string) => void;
  repost: (postId: string) => void;
  addComment: (target: { postId?: string; cardId?: string }, text: string, parentId?: string) => void;
  toggleCommentLike: (target: { postId?: string; cardId?: string }, commentId: string) => void;
  togglePinComment: (postId: string, commentId: string) => void;
  deleteComment: (target: { postId?: string; cardId?: string }, commentId: string) => void;

  /* stories */
  addStories: (items: Omit<Story, "id" | "author" | "createdAt" | "viewers" | "likedBy" | "archived">[]) => void;
  deleteStory: (id: string) => void;
  archiveStory: (id: string) => void;
  viewStory: (id: string) => void;
  toggleLikeStory: (id: string) => void;
  createHighlight: (title: string, storyIds: string[]) => void;
  updateHighlight: (id: string, patch: Partial<Highlight>) => void;
  deleteHighlight: (id: string) => void;

  /* messaging */
  openConversation: (username: string, category?: ConversationCategory) => string;
  createGroupChat: (name: string, usernames: string[]) => string;
  sendMessage: (convId: string, msg: Partial<ChatMessage> & { kind: ChatMessage["kind"] }) => void;
  toggleMessageLike: (convId: string, msgId: string) => void;
  deleteMessage: (convId: string, msgId: string) => void;
  markRead: (convId: string) => void;
  updateConversation: (convId: string, patch: Partial<Conversation>) => void;
  deleteConversation: (convId: string) => void;
  leaveConversation: (convId: string) => void;
  setGroupMembers: (convId: string, usernames: string[]) => void;
  respondMessageRequest: (convId: string, accept: boolean) => void;

  /* offers & trades */
  makeOffer: (cardId: string, amount: number) => void;
  respondOffer: (id: string, action: "accept" | "decline" | "counter", amount?: number) => void;
  requestTrade: (t: Omit<TradeRequest, "id" | "createdAt" | "status" | "direction">) => void;
  respondTrade: (id: string, accept: boolean) => void;
  payTradeLabel: (id: string, authenticate: boolean) => { success: boolean; error?: string; cost: number };
  completeTrade: (id: string) => void;

  /* orders */
  checkout: (
    cardIds: string[],
    opts: { payment: PaymentMethod; coupon?: string; shippingMethod?: ShippingMethod },
  ) => CheckoutResult;
  advanceOrder: (id: string) => void;
  confirmReceived: (id: string) => void;
  uploadProof: (id: string) => void;
  leaveReview: (r: Omit<Review, "id" | "date" | "reviewer" | "reviewerCountry">, orderId?: string) => void;

  /* wishlists */
  createWishlist: (w: Omit<Wishlist, "id" | "createdAt">) => string;
  updateWishlist: (id: string, patch: Partial<Wishlist>) => void;
  deleteWishlist: (id: string) => void;

  /* notifications */
  notify: (n: Omit<AppNotification, "id" | "at" | "read">) => void;
  markNotificationsRead: (ids?: string[]) => void;

  /* trust & safety + database */
  report: (r: Omit<Report, "id" | "at">) => void;
  submitToDatabase: (s: Omit<DatabaseSubmission, "id" | "at" | "status" | "points">) => number;
  markCatalog: (catalogId: string, mark: AppState["catalogMarks"][string] | null) => void;

  /* group orders */
  claimGroupOrder: (goId: string, cardId: string) => void;
  becomeGom: (goId: string) => void;
}

function seedState() {
  return {
    listings: [] as UserListing[],
    soldIds: [] as string[],
    heldIds: [] as string[],
    posts: seedPosts(),
    savedFolders: { "Binder inspo": ["post-4"] } as Record<string, string[]>,
    listingComments: {
      [PHOTOCARDS[0].id]: [
        { id: "lc-1", author: "biasbinder", text: "Is the corner ok?", at: new Date(Date.now() - 7200e3).toISOString(), likes: [] },
      ],
    } as Record<string, Comment[]>,
    stories: seedStories(),
    highlights: seedHighlights(),
    conversations: seedConversations(),
    offers: seedOffers(),
    trades: seedTrades(),
    orders: seedOrders(),
    wishlists: seedWishlists(),
    notifications: seedNotifications(),
    reviewsWritten: [] as Review[],
    reports: [] as Report[],
    submissions: [] as DatabaseSubmission[],
    groupOrders: seedGroupOrders(),
    catalogMarks: {} as AppState["catalogMarks"],
  };
}

function mapComments(list: Comment[], id: string, fn: (c: Comment) => Comment | null): Comment[] {
  return list.map((c) => (c.id === id ? fn(c) : c)).filter((c): c is Comment => c !== null);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const notifyInternal = (n: Omit<AppNotification, "id" | "at" | "read">) =>
        set((s) => ({ notifications: [{ ...n, id: uid("n"), at: now(), read: false }, ...s.notifications] }));

      const editComments = (target: { postId?: string; cardId?: string }, fn: (list: Comment[]) => Comment[]) => {
        if (target.postId) {
          set((s) => ({ posts: s.posts.map((p) => (p.id === target.postId ? { ...p, comments: fn(p.comments) } : p)) }));
        } else if (target.cardId) {
          const id = target.cardId;
          set((s) => ({ listingComments: { ...s.listingComments, [id]: fn(s.listingComments[id] ?? []) } }));
        }
      };

      const editConv = (convId: string, fn: (c: Conversation) => Conversation) =>
        set((s) => ({ conversations: s.conversations.map((c) => (c.id === convId ? fn(c) : c)) }));

      return {
        ...seedState(),
        reset: () => set(seedState()),

        /* ---------------- listings ---------------- */
        createListing: (draft) => get().createListings([draft])[0],
        createListings: (drafts) => {
          const created: UserListing[] = drafts.map((d) => ({
            ...d,
            id: uid("ul"),
            imgSeed: d.imgSeed ?? Math.floor(Math.random() * 9000) + 1000,
            sellerUsername: me(),
            available: true,
            popularity: 0,
            status: "active",
            promoted: false,
            createdAt: now(),
            stats: { likes: 0, saves: 0, views: 0, carts: 0 },
          }));
          set((s) => ({ listings: [...created, ...s.listings] }));
          return created;
        },
        updateListing: (id, p) => set((s) => ({ listings: s.listings.map((l) => (l.id === id ? { ...l, ...p } : l)) })),
        deleteListing: (id) => set((s) => ({ listings: s.listings.filter((l) => l.id !== id) })),
        setListingStatus: (ids, status) =>
          set((s) => ({
            listings: s.listings.map((l) =>
              ids.includes(l.id) ? { ...l, status, available: status === "active" } : l,
            ),
          })),
        setPromoted: (ids, promoted) =>
          set((s) => ({ listings: s.listings.map((l) => (ids.includes(l.id) ? { ...l, promoted } : l)) })),
        toggleHold: (id) => {
          const isUser = get().listings.some((l) => l.id === id);
          if (isUser) {
            const l = get().listings.find((x) => x.id === id)!;
            get().setListingStatus([id], l.status === "hold" ? "active" : "hold");
          } else set((s) => ({ heldIds: toggle(s.heldIds, id) }));
        },

        /* ---------------- posts ---------------- */
        createPost: (p) => {
          const post: Post = { ...p, id: uid("post"), author: me(), createdAt: now(), likes: [], savedBy: [], comments: [], archived: false };
          set((s) => ({ posts: [post, ...s.posts] }));
          return post;
        },
        updatePost: (id, p) => set((s) => ({ posts: s.posts.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
        deletePost: (id) => set((s) => ({ posts: s.posts.filter((x) => x.id !== id) })),
        toggleLikePost: (id) =>
          set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, likes: toggle(p.likes, me()) } : p)) })),
        toggleSavePost: (id, folder) =>
          set((s) => {
            const posts = s.posts.map((p) => (p.id === id ? { ...p, savedBy: toggle(p.savedBy, me()) } : p));
            const savedFolders = { ...s.savedFolders };
            if (folder) savedFolders[folder] = toggle(savedFolders[folder] ?? [], id);
            return { posts, savedFolders };
          }),
        createSavedFolder: (name) => set((s) => ({ savedFolders: { ...s.savedFolders, [name]: s.savedFolders[name] ?? [] } })),
        renameSavedFolder: (from, to) =>
          set((s) => {
            const f = { ...s.savedFolders };
            f[to] = f[from] ?? [];
            delete f[from];
            return { savedFolders: f };
          }),
        deleteSavedFolder: (name) =>
          set((s) => {
            const f = { ...s.savedFolders };
            delete f[name];
            return { savedFolders: f };
          }),
        repost: (postId) => {
          const orig = get().posts.find((p) => p.id === postId);
          if (!orig) return;
          get().createPost({
            type: orig.type,
            media: orig.media,
            caption: orig.caption,
            groupTags: orig.groupTags,
            accountTags: [orig.author],
            hashtags: orig.hashtags,
            commentsOff: false,
            hideLikes: false,
            repostOf: orig.id,
          });
        },
        addComment: (target, text, parentId) =>
          editComments(target, (list) => [...list, { id: uid("c"), author: me(), text, at: now(), likes: [], parentId }]),
        toggleCommentLike: (target, commentId) =>
          editComments(target, (list) => mapComments(list, commentId, (c) => ({ ...c, likes: toggle(c.likes, me()) }))),
        togglePinComment: (postId, commentId) =>
          editComments({ postId }, (list) => mapComments(list, commentId, (c) => ({ ...c, pinned: !c.pinned }))),
        deleteComment: (target, commentId) =>
          editComments(target, (list) => list.filter((c) => c.id !== commentId && c.parentId !== commentId)),

        /* ---------------- stories ---------------- */
        addStories: (items) =>
          set((s) => ({
            stories: [
              ...items.map((it) => ({ ...it, id: uid("st"), author: me(), createdAt: now(), viewers: [], likedBy: [], archived: false })),
              ...s.stories,
            ],
          })),
        deleteStory: (id) =>
          set((s) => ({
            stories: s.stories.filter((x) => x.id !== id),
            highlights: s.highlights.map((h) => ({ ...h, storyIds: h.storyIds.filter((x) => x !== id) })),
          })),
        archiveStory: (id) => set((s) => ({ stories: s.stories.map((x) => (x.id === id ? { ...x, archived: true } : x)) })),
        viewStory: (id) =>
          set((s) => ({
            stories: s.stories.map((x) => (x.id === id && !x.viewers.includes(me()) ? { ...x, viewers: [...x.viewers, me()] } : x)),
          })),
        toggleLikeStory: (id) =>
          set((s) => ({ stories: s.stories.map((x) => (x.id === id ? { ...x, likedBy: toggle(x.likedBy, me()) } : x)) })),
        createHighlight: (title, storyIds) => {
          const cover = get().stories.find((x) => x.id === storyIds[0])?.seed ?? 1;
          set((s) => ({ highlights: [...s.highlights, { id: uid("hl"), owner: me(), title, coverSeed: cover, storyIds: storyIds.slice(0, 500) }] }));
        },
        updateHighlight: (id, p) => set((s) => ({ highlights: s.highlights.map((h) => (h.id === id ? { ...h, ...p } : h)) })),
        deleteHighlight: (id) => set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),

        /* ---------------- messaging ---------------- */
        openConversation: (username, category = "community") => {
          const existing = get().conversations.find(
            (c) => !c.isGroup && c.participants.includes(username) && c.participants.includes(me()),
          );
          if (existing) return existing.id;
          const target = getCommunityUser(username);
          const conv: Conversation = {
            id: uid("dm"),
            participants: [me(), username],
            isGroup: false,
            category,
            dealStatus: "pending",
            pinned: false,
            muted: false,
            markedUnread: false,
            flagged: false,
            // Messages to private accounts start as requests on their side (§16J).
            isRequest: false,
            messages: [],
            folder: target?.isPrivate ? "Requested" : undefined,
          };
          set((s) => ({ conversations: [conv, ...s.conversations] }));
          return conv.id;
        },
        createGroupChat: (name, usernames) => {
          const conv: Conversation = {
            id: uid("gc"),
            participants: [me(), ...usernames.filter((u) => u !== me())],
            isGroup: true,
            name: name.trim() || undefined,
            owner: me(),
            category: "community",
            dealStatus: "pending",
            pinned: false,
            muted: false,
            markedUnread: false,
            flagged: false,
            isRequest: false,
            messages: [],
          };
          set((s) => ({ conversations: [conv, ...s.conversations] }));
          return conv.id;
        },
        sendMessage: (convId, msg) =>
          editConv(convId, (c) => ({
            ...c,
            markedUnread: false,
            messages: [...c.messages, { id: uid("msg"), from: me(), at: now(), likedBy: [], readBy: [me()], ...msg }],
          })),
        toggleMessageLike: (convId, msgId) =>
          editConv(convId, (c) => ({
            ...c,
            messages: c.messages.map((m) => (m.id === msgId ? { ...m, likedBy: toggle(m.likedBy, me()) } : m)),
          })),
        deleteMessage: (convId, msgId) =>
          editConv(convId, (c) => ({ ...c, messages: c.messages.filter((m) => m.id !== msgId || m.from !== me()) })),
        markRead: (convId) =>
          editConv(convId, (c) => ({
            ...c,
            markedUnread: false,
            messages: c.messages.map((m) => (m.readBy.includes(me()) ? m : { ...m, readBy: [...m.readBy, me()] })),
          })),
        updateConversation: (convId, p) => editConv(convId, (c) => ({ ...c, ...p })),
        deleteConversation: (convId) => set((s) => ({ conversations: s.conversations.filter((c) => c.id !== convId) })),
        leaveConversation: (convId) => get().deleteConversation(convId),
        setGroupMembers: (convId, usernames) =>
          editConv(convId, (c) => ({ ...c, participants: [me(), ...usernames.filter((u) => u !== me())] })),
        respondMessageRequest: (convId, accept) =>
          accept ? editConv(convId, (c) => ({ ...c, isRequest: false })) : get().deleteConversation(convId),

        /* ---------------- offers & trades ---------------- */
        makeOffer: (cardId, amount) => {
          const card = getAnyListing(cardId);
          if (!card) return;
          set((s) => ({
            offers: [
              { id: uid("of"), cardId, direction: "sent", counterparty: card.sellerUsername, amount: round2(amount), status: "pending", createdAt: now() },
              ...s.offers,
            ],
          }));
          const conv = get().openConversation(card.sellerUsername, "purchase");
          get().sendMessage(conv, { kind: "offer", refId: cardId, text: `Offered $${amount.toFixed(2)}` });
        },
        respondOffer: (id, action, amount) =>
          set((s) => ({
            offers: s.offers.map((o) => {
              if (o.id !== id) return o;
              if (action === "accept") return { ...o, status: "accepted", amount: o.counterAmount ?? o.amount };
              if (action === "decline") return { ...o, status: "declined" };
              // A counter from me replaces the amount and goes back to pending.
              return { ...o, status: "pending", amount: round2(amount ?? o.amount), counterAmount: undefined };
            }),
          })),
        requestTrade: (t) => {
          set((s) => ({ trades: [{ ...t, id: uid("tr"), direction: "outgoing", status: "pending", createdAt: now() }, ...s.trades] }));
          const conv = get().openConversation(t.partner, "trade");
          get().sendMessage(conv, { kind: "text", text: "Sent you a trade request 🔁" });
        },
        respondTrade: (id, accept) => {
          set((s) => ({ trades: s.trades.map((t) => (t.id === id ? { ...t, status: accept ? "accepted" : "declined" } : t)) }));
          if (accept)
            notifyInternal({ kind: "smart_trade", text: "Trade accepted — buy your label and ship within 3 days 📦", href: "/(tabs)/transactions" });
        },
        payTradeLabel: (id, authenticate) => {
          const t = get().trades.find((x) => x.id === id);
          const myValue = (t?.myCardIds ?? []).reduce((s, cid) => s + (getAnyListing(cid)?.price ?? 0), 0);
          const label = useUserStore.getState().user?.shipping?.domesticTracked ?? 4.75;
          const cost = round2(label + TRADE_SERVICE_FEE + (authenticate && myValue > 50 ? AUTH_FEE : 0) + (t?.direction === "outgoing" ? 0 : 0));
          const res = useUserStore.getState().spendWallet(cost);
          if (!res.success) return { ...res, cost };
          set((s) => ({ trades: s.trades.map((x) => (x.id === id ? { ...x, labelPaid: true, authenticate, status: "shipped" } : x)) }));
          return { success: true, cost };
        },
        completeTrade: (id) => {
          const t = get().trades.find((x) => x.id === id);
          if (!t) return;
          const us = useUserStore.getState();
          // Collection and wishlist auto-update when a trade completes (§9T).
          us.removeFromCollection(t.myCardIds);
          us.addToCollection(t.theirCardIds);
          const received = new Set(t.theirCardIds.map((cid) => getAnyListing(cid)).filter(Boolean).map((c) => catalogIdForListing(c!)));
          set((s) => ({
            trades: s.trades.map((x) => (x.id === id ? { ...x, status: "completed" } : x)),
            wishlists: s.wishlists.map((w) => ({ ...w, cardIds: w.cardIds.filter((cid) => !received.has(cid)) })),
          }));
          for (const cid of t.theirCardIds) {
            const u = useUserStore.getState().user;
            if (u?.wishlistIds.includes(cid)) useUserStore.getState().toggleWishlist(cid);
          }
        },

        /* ---------------- orders ---------------- */
        checkout: (cardIds, opts) => {
          const cards = cardIds.map(getAnyListing).filter((c): c is Photocard => Boolean(c));
          if (cards.length === 0) return { success: false, error: "Select at least one card to purchase." };
          const quote = priceCart(cards, opts.coupon);
          if (quote.couponError) return { success: false, error: quote.couponError };
          if (opts.payment === "wallet") {
            const r = useUserStore.getState().spendWallet(quote.total);
            if (!r.success) return { success: false, error: r.error };
          }
          const ratio = quote.subtotal > 0 ? quote.total / quote.subtotal : 1;
          const orders: Order[] = quote.sellers.map((s) => {
            const amount = round2(s.subtotal - s.discount);
            return {
              id: uid("ord"),
              kind: "buy",
              cardIds: s.cards.map((c) => c.id),
              cardTitle: s.cards.length > 1 ? `${s.cards[0].title} +${s.cards.length - 1}` : s.cards[0].title,
              counterparty: s.seller,
              amount: round2(amount * ratio),
              fee: round2(amount * BUYER_FEE_RATE),
              status: "pending",
              step: 0,
              shippingMethod: opts.shippingMethod ?? "domesticTracked",
              trackingNumber: `9400 ${Math.floor(1000 + Math.random() * 8999)} ${Math.floor(1000 + Math.random() * 8999)}`,
              createdAt: now(),
              reviewed: false,
              paymentMethod: opts.payment,
              groupId: s.cards[0].groupId,
            };
          });
          // Payment is held until delivery is confirmed (buyer protection, §20D).
          set((s) => ({ orders: [...orders, ...s.orders], soldIds: [...s.soldIds, ...cards.map((c) => c.id)] }));
          useUserStore.getState().removeFromCart(cards.map((c) => c.id));
          notifyInternal({ kind: "order", text: `Purchase successful — ${cards.length} card${cards.length > 1 ? "s" : ""} on the way soon`, href: "/tracking" });
          return { success: true, orderIds: orders.map((o) => o.id) };
        },
        advanceOrder: (id) =>
          set((s) => ({
            orders: s.orders.map((o) => {
              if (o.id !== id) return o;
              const step = Math.min(o.step + 1, 4);
              return { ...o, step, status: step >= 4 ? "delivered" : step >= 2 ? "in_transit" : "pending" };
            }),
          })),
        confirmReceived: (id) => {
          const o = get().orders.find((x) => x.id === id);
          if (!o) return;
          set((s) => ({ orders: s.orders.map((x) => (x.id === id ? { ...x, step: 5, status: "completed" } : x)) }));
          if (o.kind === "buy") useUserStore.getState().addToCollection(o.cardIds);
          if (o.kind === "sell") useUserStore.getState().releasePending(o.amount);
        },
        uploadProof: (id) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, proofVideo: true } : o)) })),
        leaveReview: (r, orderId) => {
          const u = useUserStore.getState().user;
          const review: Review = { ...r, id: uid("rev"), reviewer: u?.username ?? ME, reviewerCountry: u?.country ?? "US", date: now().slice(0, 10) };
          set((s) => ({
            reviewsWritten: [review, ...s.reviewsWritten],
            orders: orderId ? s.orders.map((o) => (o.id === orderId ? { ...o, reviewed: true } : o)) : s.orders,
          }));
        },

        /* ---------------- wishlists ---------------- */
        createWishlist: (w) => {
          const id = uid("wl");
          set((s) => ({ wishlists: [{ ...w, id, createdAt: now() }, ...s.wishlists] }));
          return id;
        },
        updateWishlist: (id, p) => set((s) => ({ wishlists: s.wishlists.map((w) => (w.id === id ? { ...w, ...p } : w)) })),
        deleteWishlist: (id) => set((s) => ({ wishlists: s.wishlists.filter((w) => w.id !== id) })),

        /* ---------------- notifications ---------------- */
        notify: notifyInternal,
        markNotificationsRead: (ids) =>
          set((s) => ({ notifications: s.notifications.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)) })),

        /* ---------------- trust & safety / database ---------------- */
        report: (r) => set((s) => ({ reports: [{ ...r, id: uid("rep"), at: now() }, ...s.reports] })),
        submitToDatabase: (sub) => {
          // "Circular" points: contributing to the database earns spendable points (§20J).
          const points = sub.kind === "group" ? 100 : sub.kind === "template" ? 50 : 20;
          set((s) => ({ submissions: [{ ...sub, id: uid("db"), at: now(), status: "pending", points }, ...s.submissions] }));
          useUserStore.getState().addPoints(points);
          return points;
        },
        markCatalog: (catalogId, mark) =>
          set((s) => {
            const m = { ...s.catalogMarks };
            if (mark) m[catalogId] = mark;
            else delete m[catalogId];
            return { catalogMarks: m };
          }),

        /* ---------------- group orders ---------------- */
        claimGroupOrder: (goId, cardId) =>
          set((s) => ({
            groupOrders: s.groupOrders.map((g) => {
              if (g.id !== goId) return g;
              const claims = { ...g.claims };
              if (claims[cardId] === me()) delete claims[cardId];
              else if (!claims[cardId]) claims[cardId] = me();
              const pct = (Object.keys(claims).length / g.cardIds.length) * 100;
              return { ...g, claims, status: pct >= g.thresholdPct ? "confirmed" : "open" };
            }),
          })),
        becomeGom: (goId) => set((s) => ({ groupOrders: s.groupOrders.map((g) => (g.id === goId && !g.gom ? { ...g, gom: me() } : g)) })),
      };
    },
    {
      name: "winkpop-app",
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Resolve a listing id against the seed catalogue and the user's own listings. */
export function getAnyListing(id: string): Photocard | UserListing | undefined {
  return useAppStore.getState().listings.find((l) => l.id === id) ?? getPhotocard(id);
}

/** All live marketplace listings: user listings (promoted first) + seed catalogue. */
export function allListings(state: Pick<AppState, "listings" | "soldIds"> = useAppStore.getState()): Photocard[] {
  const sold = new Set(state.soldIds);
  const mine = state.listings
    .filter((l) => l.status === "active" || l.status === "hold")
    .sort((a, b) => Number(b.promoted) - Number(a.promoted));
  return [...mine, ...PHOTOCARDS.map((p) => (sold.has(p.id) ? { ...p, available: false } : p))];
}

/** Human title for a listing, preferring the database's standardized name. */
export function listingName(card: Photocard): string {
  return getCatalogCard(catalogIdForListing(card))?.name ?? card.title;
}
