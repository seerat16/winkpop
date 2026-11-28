# Testing WinKPop

Three layers of automated testing, all free & open source:

| Layer                | Tool                              | Command            |
| -------------------- | --------------------------------- | ------------------ |
| **Unit + component** | Vitest + Testing Library (jsdom)  | `npm test`         |
| **Web E2E**          | Playwright (Chromium + iPhone VP) | `npm run test:e2e` |
| **Native UI**        | XCUITest in Xcode (see IOS_XCODE) | `Cmd + U` in Xcode |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, the unit/component suite
with coverage, a web build, and Playwright on every push and PR.

---

## 1. Unit + component tests (Vitest)

```bash
npm test               # run once
npm run test:watch     # watch mode (fast local loop)
npm run test:coverage  # coverage report
npm test -- search     # only files matching "search"
```

### Covered today

**Pure data layer** (highest value, cheapest to test):

- `src/data/search.test.ts` — group/member/era/type/price filters, free-text
  query, every sort order, filter combinations, input immutability.
- `src/data/priceHistory.test.ts` — deterministic history, stat ordering
  (low ≤ avg ≤ high), unknown-card handling.
- `src/data/userStore.test.ts` — login/signup validation, like/cart/wishlist/
  collection toggles, collecting-groups, logout.

**Components:**

- `src/components/ui.test.tsx` — Button (click, disabled), Chip (pressed state),
  EmptyState.
- `src/components/PhotocardTile.test.tsx` — renders card info, toggles cart/likes
  through the store, shows SOLD OUT.

### Writing a test

Components that navigate need a router — use the helper:

```tsx
import { renderWithRouter, screen, fireEvent } from "@/test/render";
import { PhotocardTile } from "@/components/PhotocardTile";

it("adds to cart", () => {
  useUserStore.getState().loginDemo();
  renderWithRouter(<PhotocardTile card={card} />);
  fireEvent.click(screen.getByLabelText("Add to cart"));
  expect(useUserStore.getState().user?.cartIds).toContain(card.id);
});
```

The store + localStorage reset automatically between tests (see
`src/test/setup.ts`).

---

## 2. Web E2E (Playwright)

Runs the real production build in Chromium **and** an emulated iPhone viewport.
Playwright builds + previews the app itself (see `playwright.config.ts`).

```bash
npx playwright install   # one-time: download browsers
npm run test:e2e         # run the suite
```

The smoke suite (`e2e/smoke.spec.ts`) covers the core journey: **demo login →
browse/filter → add to cart → secure checkout**.

Debug interactively:

```bash
npx playwright test --ui       # time-travel UI
npx playwright test --headed   # watch it run
```

---

## 3. Native UI tests (iOS)

Because Capacitor produces a normal Xcode project, you can add Apple's
**XCUITest** UI tests. See **[`IOS_XCODE.md`](IOS_XCODE.md) §7** for a worked
example and the `xcodebuild test` command. For most UI coverage, the Playwright
suite against the web build is the recommended first line of defense since it's
cross-platform and runs in CI.

---

## 4. Coverage

```bash
npm run test:coverage   # text summary + coverage/ HTML report
```

Keep the **data layer near 100%** — it's pure and central.

---

## 5. Roadmap

As deferred features land (trade matching, payments, community), add: matching
unit tests, a checkout/transaction state-machine test, and extend the E2E flows
to cover listing creation and a full trade.
