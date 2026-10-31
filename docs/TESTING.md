# Testing WinKPop

The project uses **Jest** (via `jest-expo`) with
**@testing-library/react-native** for component tests.

---

## 1. Running tests

```bash
npm test                 # run the whole suite once
npm run test:watch       # re-run on file changes
npm run test:coverage    # run with a coverage report
npm test -- search       # run only files matching "search"
```

> Use `npm run test:watch` locally for the fast feedback loop. In CI, prefer the
> single-run `npm test`.

---

## 2. What's tested today

The highest-value, highest-risk logic is the **pure data layer** — the
photocard-native search and the price-intelligence engine. These are the core
differentiators from the product research, and being pure functions they are
cheap to test exhaustively.

- `src/data/__tests__/search.test.ts` — group/member/era/type/price filtering,
  free-text query, every sort order, filter combinations, and input immutability.
- `src/data/__tests__/priceHistory.test.ts` — deterministic history generation,
  stat ordering (low ≤ avg ≤ high), and unknown-card handling.

This follows the research's own prioritisation formula
(`priority = severity × failure-probability ÷ cost-to-test`): search and pricing
are high-severity and cheap to test, so they're covered first.

---

## 3. Writing a logic (unit) test

Put it next to the code under test in a `__tests__/` folder:

```ts
// src/data/__tests__/example.test.ts
import { searchPhotocards } from "../search";
import { PHOTOCARDS } from "../photocards";

describe("searchPhotocards", () => {
  it("only returns available cards when hideOutOfStock is set", () => {
    const result = searchPhotocards(PHOTOCARDS, { hideOutOfStock: true });
    expect(result.every((c) => c.available)).toBe(true);
  });
});
```

---

## 4. Writing a component test

`@testing-library/react-native` renders components and lets you assert on what
the user sees. Example for the shared `Button`:

```tsx
// src/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Button } from "../Button";

it("fires onPress when tapped", () => {
  const onPress = jest.fn();
  render(<Button title="Add to cart" onPress={onPress} />);
  fireEvent.press(screen.getByText("Add to cart"));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it("shows a spinner and blocks taps while loading", () => {
  const onPress = jest.fn();
  render(<Button title="Save" loading onPress={onPress} />);
  fireEvent.press(screen.getByRole("button"));
  expect(onPress).not.toHaveBeenCalled();
});
```

Prefer querying by **accessible role / text** (as above) over test IDs — it keeps
tests close to real user behaviour and works across platforms.

---

## 5. Testing screens that use the store

Screens read from the Zustand store. Reset it between tests so state doesn't
leak:

```tsx
import { useUserStore } from "@/data/userStore";

beforeEach(() => {
  useUserStore.setState({ user: null, hydrated: true });
});
```

You can also seed a user directly: `useUserStore.getState().loginDemo()`.

---

## 6. Coverage

```bash
npm run test:coverage
```

Opens a text summary and writes an HTML report to `coverage/lcov-report/index.html`.
Coverage is collected from `src/**` (see `collectCoverageFrom` in
`jest.config.js`). Aim to keep the **data layer at or near 100%** — it's pure and
central — and cover the shared components' interaction paths.

---

## 7. What to test next (roadmap)

From the PRD's "What to Test" section, the priority order is:

1. **Search accuracy** — ✅ covered.
2. **Wishlist ↔ listing matching** — add once matching logic lands.
3. **Checkout price/terms lock** — test the cart total + buyer-fee math.
4. **Transaction state machine** — `paid → label → shipped → delivered → released/disputed`.
5. **Full flow (E2E)** — onboarding → search → wishlist → cart → checkout, using
   Maestro or Playwright (web) once the backend is wired.
