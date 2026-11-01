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

## Running the app

WinKPop is **one Expo codebase** that runs on Web, iOS, and Android. Pick the
platform you want below. More detail (env vars, production builds) lives in
[`docs/RUNNING.md`](docs/RUNNING.md); troubleshooting is in
[`docs/DEBUGGING.md`](docs/DEBUGGING.md).

### 0. Get the code & install dependencies (do this once, all platforms)

> Requires **Node 18+** (Node 20 LTS recommended) and **npm** — check with `node -v`.

```bash
git clone https://github.com/seerat16/winkpop.git
cd winkpop
npm install          # installs all dependencies (needs internet the first time)
```

Once the app is open on any platform, you'll see the **login screen** — tap
**"Explore as demo collector"** to jump straight into a seeded account (or log in
with any email/password).

---

### 🌐 Web (fastest — works on any OS, no extra tooling)

```bash
npm run web
```

This opens the app at `http://localhost:8081` (watch the terminal in case Metro
picks another port). Hot reload is on — save a file and the browser updates.

**Production web build:**

```bash
npx expo export --platform web   # static site -> ./dist
npx serve dist                   # preview it locally
```

---

### 🍎 iOS

> **iOS requires a Mac.** Use the Simulator path on macOS, or the Expo Go path
> below from **any OS** (Windows/Linux included) to test on a physical iPhone.

**Option 1 — iOS Simulator (macOS only)**

1. Install **Xcode** from the Mac App Store, open it once to accept the license,
   then install the command-line tools:
   ```bash
   xcode-select --install
   ```
   In Xcode → **Settings → Platforms**, make sure an **iOS simulator runtime** is
   installed.
2. Launch the app in the simulator:
   ```bash
   npm run ios
   ```
   The first build takes a few minutes; later runs are fast with hot reload.

**Option 2 — Physical iPhone via Expo Go (any OS, no Xcode)**

1. Install **Expo Go** from the App Store on your iPhone.
2. Start the dev server: `npm start`
3. Open the iPhone **Camera**, scan the QR code in the terminal, and tap the
   banner to open WinKPop in Expo Go.
   > Phone and computer must be on the **same Wi-Fi**. If it won't connect, use
   > `npx expo start --tunnel`.

---

### 🤖 Android

> Works on **macOS, Windows, and Linux**.

**Option 1 — Android Emulator**

1. Install **[Android Studio](https://developer.android.com/studio)**.
2. In Android Studio's **Device Manager**, create an **Android Virtual Device
   (AVD)** and start it — or plug in a physical device with **USB debugging**
   enabled.
3. Make sure `adb` is on your `PATH` (Android Studio installs it under
   `~/Library/Android/sdk/platform-tools` on macOS, or
   `%LOCALAPPDATA%\Android\Sdk\platform-tools` on Windows).
4. Launch the app:
   ```bash
   npm run android
   ```

**Option 2 — Physical Android phone via Expo Go**

1. Install **Expo Go** from the Play Store.
2. Start the dev server: `npm start`
3. Scan the QR code in the terminal with the **Expo Go** app.

---

### 🧪 Running the tests (all platforms)

```bash
npm test               # unit + component tests (run in jsdom — platform-agnostic)
npm run test:coverage  # with a coverage report
npm run test:e2e:web   # Playwright web E2E (first: npx playwright install)
npm run test:e2e:native  # Maestro E2E on an iOS/Android emulator (see e2e/native/README.md)
```

### ✅ What to check once it's running

Walk the core journey on any platform:

1. **Discover** — the home feed, personalised to your groups.
2. **Browse** — filter photocards by **group → member → era → card type → price**.
3. Tap a **card** — see the **price-intelligence** sold-price chart (low/avg/high).
4. **Add to cart** → open the **cart** → confirm the **5% buyer-protection** total.
5. **Wishlist / Transactions / Profile** tabs.

### If something goes wrong

| Problem                          | Fix                                          |
| -------------------------------- | -------------------------------------------- |
| Weird Metro/cache errors         | `npx expo start -c` (clears the cache)       |
| Dependency resolution errors     | `rm -rf node_modules && npm install`         |
| iOS: "unable to find simulator"  | Install an iOS runtime in Xcode → Platforms  |
| Android: emulator can't reach JS | `adb reverse tcp:8081 tcp:8081`, then reload |
| Expo Go won't connect            | `npx expo start --tunnel` (cross-network)    |

More in [`docs/DEBUGGING.md`](docs/DEBUGGING.md).

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
