<div align="center">

# 🩷 WinKPop

**The photocard-native marketplace for K-pop collectors.**
A **React + Vite** web app, wrapped for **iOS & Android** with **Capacitor**.

</div>

---

WinKPop unifies the two broken halves of the K-pop photocard ecosystem — the
community/discovery of Instagram and the transaction safety of Mercari — with
the features collectors actually asked for:

- 🔎 **Photocard-native search** — filter by group → member → era → card type → price
- 💸 **Zero seller fees** — the headline differentiator vs. Mercari's 10–13%
- 📈 **Price intelligence** — a "StockX for photocards" sold-price history
- 💜 **Collection & wishlist tracking** — wishlist / likes / collection in one place
- 🔁 **Buy, sell & trade** — with escrow-style payment holding
- 🛡️ **Trust & safety** — seller ratings, verification badges, buyer protection

## Tech stack (all free & open source)

| Concern             | Choice                                        | Why                                           |
| ------------------- | --------------------------------------------- | --------------------------------------------- |
| Web app             | **React 18 + Vite + TypeScript**              | Fast, standard React — runs in any browser    |
| Native iOS/Android  | **Capacitor**                                 | Wraps the same web build as a real native app |
| Styling             | **Tailwind CSS**                              | One styling system everywhere                 |
| Routing             | **React Router**                              | Standard client-side routing                  |
| State & persistence | **Zustand** + localStorage                    | Tiny, no boilerplate                          |
| Testing             | **Vitest** + Testing Library · **Playwright** | Unit, component & end-to-end tests            |

> **How it runs on a phone:** Capacitor builds a thin native shell (a real Xcode
> project for iOS, a Gradle project for Android) that loads the compiled React
> app from `dist/`. The same codebase is your website _and_ your mobile app.

## Quick start

> Requires **Node 18+** (Node 20 recommended) — check with `node -v`.

```bash
git clone https://github.com/seerat16/winkpop.git
cd winkpop
npm install
npm run dev        # open the web app at http://localhost:5173
```

Log in with any email/password, or click **"Explore as demo collector"** to jump
into a seeded account.

---

## Running on each platform

### 🌐 Web

```bash
npm run dev        # dev server with hot reload (http://localhost:5173)
npm run build      # production build -> dist/
npm run preview    # preview the production build locally
```

### 🍎 iOS — full Xcode walkthrough

See the detailed, step-by-step guide in **[`docs/IOS_XCODE.md`](docs/IOS_XCODE.md)**.
Short version (requires a **Mac** + **Xcode 26**):

```bash
# @capacitor/ios is already a dependency (installed by `npm install`)
npx cap add ios                 # generate the native Xcode project (one time)
npm run build                   # build the web app
npx cap sync ios                # copy the web build into the iOS project
npx cap open ios                # open the project in Xcode
```

Then in Xcode: pick a simulator (e.g. iPhone 16) and press **▶ Run**.
`npm run ios` does the build + sync + open in one command.

### 🤖 Android

```bash
# @capacitor/android is already a dependency (installed by `npm install`)
npx cap add android
npm run android     # build + sync + open in Android Studio
```

Then in Android Studio press **▶ Run** on an emulator or connected device.

---

## Testing

```bash
npm test             # unit + component tests (Vitest)
npm run test:watch   # watch mode
npm run test:coverage
npm run test:e2e     # Playwright E2E (first: npx playwright install)
```

Full details in [`docs/TESTING.md`](docs/TESTING.md).

## Project structure

```
winkpop/
├── index.html                # Vite entry
├── capacitor.config.ts       # native wrapper config (appId, webDir)
├── src/
│   ├── main.tsx              # React entry (mounts BrowserRouter)
│   ├── App.tsx               # routes + auth gate
│   ├── components/           # shared UI: Layout, Logo, PhotocardTile, ui.tsx
│   ├── screens/              # Login, Onboarding, Home, Browse, Wishlist, …
│   ├── data/                 # types + mock data + pure logic (search, pricing)
│   ├── test/                 # Vitest setup + render helper
│   └── styles/global.css     # Tailwind entry + safe-area CSS
├── e2e/                      # Playwright specs
├── docs/                     # RUNNING · IOS_XCODE · DEBUGGING · TESTING · ARCHITECTURE
└── .github/workflows/ci.yml  # typecheck · lint · test · build · e2e
```

## Documentation

| Doc                                            | What's inside                                      |
| ---------------------------------------------- | -------------------------------------------------- |
| [`docs/RUNNING.md`](docs/RUNNING.md)           | Run on Web, iOS, Android + prerequisites           |
| [`docs/IOS_XCODE.md`](docs/IOS_XCODE.md)       | **Full Xcode 26 walkthrough** — simulator & device |
| [`docs/DEBUGGING.md`](docs/DEBUGGING.md)       | DevTools, logs, common errors & fixes              |
| [`docs/TESTING.md`](docs/TESTING.md)           | Unit, component & E2E testing                      |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Data layer, backend seam, how Capacitor fits       |

## License

[MIT](LICENSE) — free and open source.
