# Testing WinKPop

WinKPop ships with three layers of automated testing, all free & open source:

| Layer                | Tool                                 | Runs where                       | Command                   |
| -------------------- | ------------------------------------ | -------------------------------- | ------------------------- |
| **Unit + component** | Jest + @testing-library/react-native | Node (jsdom) — platform-agnostic | `npm test`                |
| **Web E2E**          | Playwright                           | real Chromium + mobile viewport  | `npm run test:e2e:web`    |
| **Native E2E**       | Maestro                              | iOS simulator + Android emulator | `npm run test:e2e:native` |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, the unit/component suite,
a web build, and the Playwright web E2E on every push and PR.

---

## 1. Unit + component tests (Jest)

```bash
npm test                 # run the whole suite once
npm run test:watch       # re-run on file changes (fast local loop)
npm run test:coverage    # run with a coverage report
npm test -- search       # run only files matching "search"
```

The Jest preset is `jest-expo`, so the **same tests validate logic for all three
platforms** — they run against the shared React Native component tree in jsdom.

### What's covered

**Pure data layer** (highest value, cheapest to test — covered exhaustively):

- `src/data/__tests__/search.test.ts` — group/member/era/type/price filters,
  free-text query, every sort order, filter combinations, input immutability.
- `src/data/__tests__/priceHistory.test.ts` — deterministic history, stat
  ordering (low ≤ avg ≤ high), unknown-card handling.
- `src/data/__tests__/userStore.test.ts` — login/signup validation, like/cart/
  wishlist/collection toggles, collecting-groups update, logout.

**Shared components & screens:**

- `src/components/__tests__/Button.test.tsx` — press, disabled, loading states.
- `src/components/__tests__/Chip.test.tsx` — press + selected accessibility state.
- `src/components/__tests__/PhotocardTile.test.tsx` — renders card info, routes to
  detail, toggles cart/likes through the store, shows SOLD OUT.
- `app/__tests__/cart.test.tsx` — empty state, subtotal + 5% buyer-protection +
  total math, removing a card.

This follows the research's own prioritisation formula
(`priority = severity × failure-probability ÷ cost-to-test`).

### Writing a unit test

```ts
import { searchPhotocards } from "@/data/search";
import { PHOTOCARDS } from "@/data/photocards";

it("only returns available cards when hideOutOfStock is set", () => {
  const result = searchPhotocards(PHOTOCARDS, { hideOutOfStock: true });
  expect(result.every((c) => c.available)).toBe(true);
});
```

### Writing a component test

Prefer querying by **accessible role / text / label** over test IDs:

```tsx
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Button } from "@/components/Button";

it("fires onPress when tapped", () => {
  const onPress = jest.fn();
  render(<Button title="Add to cart" onPress={onPress} />);
  fireEvent.press(screen.getByText("Add to cart"));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

### Testing screens that use the store / router

`jest.setup.js` already mocks `expo-router` and `react-native-safe-area-context`.
Reset the Zustand store between tests so state doesn't leak:

```tsx
import { useUserStore } from "@/data/userStore";

beforeEach(() => {
  useUserStore.setState({ user: null, hydrated: true });
  useUserStore.getState().loginDemo(); // seed a demo user if needed
});
```

Assert navigation via the exposed router mock: `expect(global.__expoRouterMock.push).toHaveBeenCalledWith("/card/pc-test")`.

---

## 2. Web end-to-end (Playwright)

Drives the real app in Chromium **and** an emulated iPhone viewport. Playwright
boots the Expo web server itself (see `webServer` in the config).

```bash
npx playwright install   # one-time: download browsers
npm run test:e2e:web     # run the web E2E suite
```

Specs live in `e2e/web/specs/`. The smoke suite covers the core journey:
**log in (demo) → browse/filter → open a card → add to cart → reach checkout.**

Debug interactively:

```bash
npx playwright test --config e2e/web/playwright.config.ts --ui      # time-travel UI
npx playwright test --config e2e/web/playwright.config.ts --headed  # watch it run
```

---

## 3. Native end-to-end (Maestro)

Runs the same journey on the **iOS simulator** and **Android emulator** using
Maestro's simple YAML flows. Full setup in [`e2e/native/README.md`](../e2e/native/README.md).

```bash
# one-time install
curl -fsSL "https://get.maestro.mobile.dev" | bash

# with the app running on a simulator/emulator (npm run ios / android):
npm run test:e2e:native            # run all flows
maestro test e2e/native/flows/login.yaml   # run one flow
```

Flows target `appId: com.winkpop.app` and locate elements by visible text and
`testID`s (`cart`, `Add to cart`) that the components expose for exactly this.

---

## 4. Coverage

```bash
npm run test:coverage
```

Writes an HTML report to `coverage/lcov-report/index.html`. Coverage is collected
from `src/**` (see `collectCoverageFrom` in `jest.config.js`). Keep the **data
layer at/near 100%** — it's pure and central.

---

## 5. Roadmap

As the deferred features land (trade matching, payments/shipping, community),
add: matching-logic unit tests, a checkout/transaction state-machine test
(`paid → label → shipped → delivered → released/disputed`), and extend the E2E
smoke flows to cover listing creation and a full trade.
