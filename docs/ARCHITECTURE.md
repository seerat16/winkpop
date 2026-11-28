# Architecture

---

## 1. One web codebase, three targets

WinKPop is a **React + Vite** single-page app. It runs:

- in any **browser** (the web product),
- on **iOS** and **Android** via **Capacitor**, which wraps the exact same
  compiled web bundle (`dist/`) inside a native WebView.

There is no platform-specific screen code. A `PhotocardTile` written once renders
in the browser and inside the native app identically — the "maximum component
reuse" goal.

### How Capacitor fits

```
src/ (React) ──npm run build──▶ dist/ (static web bundle)
                                   │
                  npx cap sync ────┼────▶ ios/      (Xcode project → iPhone)
                                   └────▶ android/  (Gradle project → Android)
```

- `capacitor.config.ts` sets `appId` (`app.winkpop`) and `webDir` (`dist`).
- The native projects (`ios/`, `android/`) are **generated** with `npx cap add`
  and are gitignored by default — regenerate them on any machine.
- Native device features (camera, haptics, status bar) are available through
  Capacitor plugins when needed; the installed `@capacitor/*` packages cover the
  basics.

---

## 2. Routing & auth gate

`react-router-dom` with a single `<BrowserRouter>` (`src/main.tsx`). Routes are
declared in `src/App.tsx`:

- Public: `/login`, `/onboarding`.
- Protected: everything under `/` is wrapped in `<RequireAuth>` + `<Layout>`
  (the bottom tab bar). `RequireAuth` redirects to `/login` when there's no user.

The five tabs (`home`, `browse`, `wishlist`, `transactions`, `profile`) plus
stacked routes (`card/:id`, `cart`, `settings`) all render inside `Layout`.

---

## 3. The data layer is the backend seam

```
src/data/
├── types.ts          domain model (the contract)
├── groups.ts         seed catalogue: groups → members → eras
├── photocards.ts     deterministic marketplace catalogue
├── search.ts         pure photocard-native search  ← core feature
├── priceHistory.ts   pure price-intelligence engine ← core feature
├── transactions.ts   seed transaction history
└── userStore.ts      Zustand store (auth, likes, cart, wishlist, collection)
```

**The rule:** screens import from `@/data/*`; the mock data implements
`types.ts`. To plug in a real backend later (e.g. Supabase, Firebase, a custom
API):

1. Keep `types.ts` as the contract.
2. Replace the bodies of `searchPhotocards`, the catalogue getters, and the store
   actions with API calls returning the **same shapes**.
3. Screens don't change.

`searchPhotocards`, `getPriceHistory`, and `getPriceStats` are **pure functions**
— trivially unit-tested, and validated first.

---

## 4. Styling & design system

- **Tailwind** utilities (`tailwind.config.js` defines the `wink.*` palette).
- Shared primitives in `src/components/ui.tsx` (`Button`, `Chip`, `EmptyState`),
  plus `Logo`, `PhotocardImage`, `PhotocardTile`, `Layout` — compose screens from
  these.
- `src/styles/global.css` carries the Tailwind entry **and** `safe-area-inset`
  CSS variables so the layout respects the iPhone notch and home indicator.

### Brand

Kawaii pastel — a winking eye with a heart pupil, the rounded "winkpop"
wordmark, and a lavender/mint/pink palette. `Logo.tsx` is inline SVG, crisp at
any size.

---

## 5. State & persistence

`userStore.ts` is a **Zustand** store with the `persist` middleware writing to
**localStorage** (key `winkpop-user`). On native this is the WebView's local
storage, so sessions survive app restarts. It holds the session plus likes,
cart, wishlist, and collection.

---

## 6. Photocard images

No licensed scans ship with the app. `PhotocardImage.tsx` renders a deterministic
two-tone gradient (seeded by group color + card seed) with the member's
initials — varied, legally clean, offline. It's the single swap point for real
images once a storage backend exists.

---

## 7. Roadmap seams (not yet built)

- **Trade matching** — a `matchTrades(wishlist, listings)` pure function beside
  `search.ts`, surfaced on a trades screen.
- **Payments & shipping** — Stripe Connect + EasyPost in a `src/services/`
  module behind the transaction store.
- **Community (posts / stories / DMs)** — new routes layered on top of the
  transaction core.
- **Listing creation** — an upload form writing into the catalogue/store.

## Screens, `src/rn` and payments (added with the full feature set)

- **`src/screens/*`**: about 55 feature screens (Discover, Browse, listing pages,
  cart and checkout, trading, tracking, messages, posts, stories, profiles,
  collection, wishlists, database, settings…). Routes live in `src/App.tsx`. Tab
  screens render inside `components/Layout.tsx` (Discover · Transactions · + ·
  Messages · Profile). Every other screen is full-screen.
- **`src/rn/*`**: the feature screens were first written against React Native's
  primitives. `src/rn` renders `View`, `Text`, `Pressable`, `ScrollView`,
  `TextInput` and `Modal` as plain DOM with Tailwind, and `src/rn/router` maps
  `router.push("/(tabs)/home")`-style navigation onto react-router. New screens
  can use either these primitives or plain JSX.
- **`src/data/*`**: domain types, the photocard database (`catalog.ts`), pure
  business rules (`commerce.ts`, `community.ts`) and two persisted zustand
  stores (`userStore`, `appStore`).
- **`src/lib/*` + `supabase/*`**: the payments backend. With no env vars, the app
  is in demo mode and nothing leaves the device. See `docs/PAYMENTS.md`.
