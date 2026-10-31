<div align="center">

# 🩷 WinKPop

**The photocard-native marketplace for K-pop collectors.**
One open-source codebase → **iOS · Android · Web**.

</div>

---

WinKPop unifies the two broken halves of the K-pop photocard ecosystem — the
community/discovery of Instagram and the transaction safety of Mercari — into a
single purpose-built app, with the features collectors actually asked for:

- 🔎 **Photocard-native search** — filter by group → member → era → card type → price
- 💸 **Zero seller fees** — the headline differentiator vs. Mercari's 10–13%
- 📈 **Price intelligence** — a "StockX for photocards" sold-price history (a complete market gap)
- 💜 **Collection & wishlist tracking** — wishlist / likes / collection in one place
- 🔁 **Buy, sell & trade** — with escrow-style payment holding
- 🛡️ **Trust & safety** — seller ratings, verification badges, buyer protection

> Primary target user: the **1–3 year collector** (highest spend, highest app-usefulness rating in primary research).

## Tech stack (all free & open source)

| Concern             | Choice                                                                | Why                                                              |
| ------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| App framework       | **Expo + React Native + Expo Router**                                 | One codebase for iOS, Android, and Web — maximum component reuse |
| Language            | **TypeScript** (strict)                                               | Type-safe end to end                                             |
| Styling             | **NativeWind** (Tailwind for RN)                                      | Same utility classes on every platform                           |
| State & persistence | **Zustand** + AsyncStorage                                            | Tiny, cross-platform, no boilerplate                             |
| Icons / vectors     | **lucide-react-native** + **react-native-svg**                        | Crisp on all platforms                                           |
| Testing             | **Jest** + RNTL · **Playwright** (web E2E) · **Maestro** (native E2E) | Unit, component & end-to-end on every platform                   |

The app runs today against a **typed mock data layer** (`src/data/`). That layer
is the single seam where a real backend (e.g. Supabase, also open source) plugs
in later — screens never import mock data directly, only the `@/data` barrel.

## Quick start

> Requires **Node 18+** (Node 22 recommended) and **npm**. For a device/emulator
> you'll also want the platform tooling described in [`docs/RUNNING.md`](docs/RUNNING.md).

```bash
npm install          # install dependencies
npm run web          # open the app in your browser
npm run ios          # open the iOS simulator  (macOS only)
npm run android      # open the Android emulator
npm start            # start the dev server and pick a platform interactively

npm test             # unit + component tests (all platforms, via jsdom)
npm run test:e2e:web # Playwright web E2E (after: npx playwright install)
```

Then log in with any email/password, or tap **"Explore as demo collector"** to
jump straight into a seeded account.

## Project structure

```
winkpop/
├── app/                      # Expo Router — file-based routes
│   ├── _layout.tsx           #   root layout + auth gate
│   ├── index.tsx             #   entry redirect
│   ├── (auth)/               #   login, onboarding (group selection)
│   ├── (tabs)/               #   home, browse, wishlist, transactions, profile
│   ├── card/[id].tsx         #   card detail + price intelligence
│   ├── cart.tsx              #   cart + checkout summary
│   └── settings.tsx
├── src/
│   ├── components/           # shared cross-platform UI library
│   ├── data/                 # typed domain model + mock data + pure logic
│   │   └── __tests__/        # unit tests for the pure logic
│   ├── theme/                # color tokens (mirrors tailwind.config.js)
│   └── styles/global.css     # Tailwind entry
├── docs/                     # RUNNING · DEBUGGING · TESTING · ARCHITECTURE
├── tailwind.config.js        # WinKPop design tokens
├── app.json                  # Expo app config
└── package.json
```

## Documentation

| Doc                                            | What's inside                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| [`docs/RUNNING.md`](docs/RUNNING.md)           | How to run each platform (Web, iOS, Android), prerequisites, env setup |
| [`docs/DEBUGGING.md`](docs/DEBUGGING.md)       | DevTools, logs, common errors + fixes, per-platform debugging          |
| [`docs/TESTING.md`](docs/TESTING.md)           | How to write & run tests, coverage, what to test                       |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Data layer, component system, swapping in a real backend               |

## License

[MIT](LICENSE) — free and open source.
