# Architecture

How WinKPop is put together, and how to extend it.

---

## 1. One codebase, three platforms

WinKPop is an **Expo (React Native)** app. The same React component tree renders:

- as native views on **iOS** and **Android** (via React Native)
- as DOM on **Web** (via `react-native-web`)

There is **no platform-specific screen code** in the core flows — every screen in
`app/` and every component in `src/components/` runs everywhere. This is the
"maximum component reusability" goal: write a `PhotocardTile` once, use it on all
three platforms.

Where a true platform difference is ever needed, React Native's `Platform.select`
or `.ios.tsx` / `.android.tsx` / `.web.tsx` file extensions handle it — but the
current app needs none.

---

## 2. Navigation (Expo Router)

Routing is **file-based** under `app/`:

```
app/
├── _layout.tsx           root stack + auth gate + global providers + cart expiry
├── index.tsx             redirect to the auth gate
├── (auth)/               login, forgot, instagram connect, 5-step onboarding (no tab bar)
├── (tabs)/               bottom tab bar: Discover · Transactions · + · Messages · Profile
│   ├── _layout.tsx       tabs + the "What would you like to upload?" sheet
│   ├── home.tsx          Discover (stories, feeds, 1–3 per row, domestic/global)
│   ├── transactions.tsx  Buying · Selling · Trading · Tracking
│   ├── upload.tsx        placeholder for the + tab
│   ├── messages.tsx      inbox, filters, folders, requests
│   ├── profile.tsx       your profile
│   ├── browse.tsx        (hidden tab) photocard-native search + Groups directory
│   └── wishlist.tsx      (hidden tab) legacy "My Cards"
├── card/[id].tsx         listing page (+ price intelligence, offers, trade, comments)
├── catalog/[id].tsx      photocard database entry
├── database.tsx          database browser · scan · contribute
├── group/[id].tsx        group page
├── listing/new.tsx       create / edit / bulk list
├── post/new.tsx, post/[id].tsx
├── story/new.tsx, story/[username].tsx, highlights.tsx
├── chat/[id].tsx, chat/new.tsx, share.tsx
├── cart.tsx, buy/[id].tsx, likes.tsx, saves.tsx, saved-folders.tsx, hub.tsx
├── trade/new.tsx, tracking/index.tsx, tracking/[id].tsx, review/[orderId].tsx
├── user/[username].tsx, follows/[username].tsx, reviews/[username].tsx
├── collection.tsx, wishlists/{index,new,[id]}.tsx, edit-collecting.tsx
├── edit-profile.tsx, settings/{index,shipping,payments,notifications,blocked}.tsx
└── notifications.tsx, safety.tsx, tutorial.tsx, community.tsx, group-orders.tsx
```

Parentheses like `(auth)` and `(tabs)` are **route groups** — they organise files
and share a layout without adding a path segment. The root `_layout.tsx` holds
the **auth gate**: it watches the store and redirects between the `(auth)` and
`(tabs)` groups based on whether a user is signed in.

---

## 3. The data layer is the backend seam

```
src/data/
├── types.ts          domain model (the contract)
├── groups.ts         seed catalogue: groups → members (incl. former) → eras
├── photocards.ts     deterministic marketplace catalogue
├── catalog.ts        photocard DATABASE: standardized names, categories, versions, stores ← core
├── search.ts         pure photocard-native search  ← core feature
├── priceHistory.ts   pure price-intelligence engine ← core feature
├── commerce.ts       pure rules: fees, cart/bundles/coupons, shipping, validation, matching
├── community.ts      seed collectors, reviews, badges, three-strikes
├── seed.ts           seed posts, stories, chats, offers, trades, orders, wishlists, GOs
├── transactions.ts   seed transaction history
├── userStore.ts      Zustand store: session, profile, prefs, social graph, collection, wallet
├── appStore.ts       Zustand store: listings, posts, stories, chats, offers, trades, orders…
└── index.ts          barrel — screens import from "@/data"
```

**The rule:** screens and components import from `@/data` (the barrel), never
from a specific mock file. The mock data _implements_ the types in `types.ts`.
To swap in a real backend (e.g. **Supabase**, also open source):

1. Keep `types.ts` as the contract.
2. Replace the bodies of `searchPhotocards`, the catalogue getters, and the store
   actions (`login`, `signup`, `toggleCart`, …) with API/SDK calls that return
   the **same shapes**.
3. Screens don't change.

Because `searchPhotocards`, `getPriceHistory`, and `getPriceStats` are **pure
functions**, they're trivially unit-testable and were validated first.

---

## 4. Styling & design system

- **Tokens** live in `tailwind.config.js` (the `wink.*` color scale) and are
  mirrored in `src/theme/colors.ts` for cases that need a raw color string (SVG
  fills, gradients). Keep the two in sync.
- Components use **NativeWind** `className` utilities.
- The reusable primitives in `src/components/` (`Button`, `Chip`, `Screen`,
  `Text`, `Logo`, `PhotocardImage`, `PhotocardTile`, `EmptyState`) are the design
  system. Compose screens from these rather than restyling from scratch.

### Brand

The palette and logo derive from the WinKPop brand: a kawaii **winking eye** with
a heart pupil, a rounded **"winkpop"** wordmark, and a pastel **lavender / mint /
pink** scheme with pastel-bear mascots. `Logo.tsx` rebuilds the mark as scalable
SVG so it's crisp on every platform.

---

## 5. State & persistence

`userStore.ts` is a **Zustand** store persisted to **AsyncStorage** (which is
`localStorage` on Web). It holds the session plus the user's likes, cart,
wishlist, and collection. The `hydrated` flag tells the auth gate when persisted
state has finished loading, so we don't flash the login screen on reload.

---

## 6. Photocard images

We ship **no licensed card scans**. `PhotocardImage.tsx` renders a deterministic
two-tone gradient (seeded by the group color + card seed) with the member's
initials. This keeps the catalogue visually varied, legally clean, and fully
offline. It's the **single swap point** for real images once an image/storage
backend exists.

---

## 7. Mapping to the product research

| Research priority                      | Where it lives                                          |
| -------------------------------------- | ------------------------------------------------------- |
| Photocard-native search (#1 complaint) | `src/data/search.ts` + `app/(tabs)/browse.tsx`          |
| Zero seller fees                       | cart math in `app/cart.tsx` (buyer protection fee only) |
| Price intelligence ("StockX for PCs")  | `src/data/priceHistory.ts` + `app/card/[id].tsx`        |
| Collection / wishlist tracking         | `app/(tabs)/wishlist.tsx` + store                       |
| Trust & safety                         | profile ratings/badges; escrow copy in checkout         |
| Onboarding by group                    | `app/(auth)/onboarding.tsx`                             |

---

## 8. Roadmap seams (not yet built)

These have clear homes when you're ready:

- **Trade matching** — a `matchTrades(wishlist, listings)` pure function beside
  `search.ts`, surfaced on a `trades` screen.
- **Payments & shipping** — Stripe Connect + EasyPost, per the research doc, as a
  `src/services/` module behind the transaction store.
- **Community (posts / stories / DMs)** — a new `(tabs)` or stacked route group,
  sitting _on top of_ the transaction core (it's supplementary per the PRD).
