# Running WinKPop

WinKPop is a **React + Vite** web app that is wrapped as a native **iOS/Android**
app with **Capacitor**. The same code runs in a browser and on a phone.

---

## 1. Prerequisites (all platforms)

- **Node.js 18+** (Node 20 recommended) — <https://nodejs.org>
- **npm** (bundled with Node)

Install once:

```bash
git clone https://github.com/seerat16/winkpop.git
cd winkpop
npm install
```

---

## 2. Web

```bash
npm run dev        # dev server with hot reload -> http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # serve the production build locally -> http://localhost:4173
```

Log in with any email/password, or click **"Explore as demo collector"**.

---

## 3. iOS

Full walkthrough: **[`IOS_XCODE.md`](IOS_XCODE.md)**. Requires a **Mac + Xcode 26**.

```bash
npx cap add ios        # one time — generates the ./ios Xcode project
npm run ios            # build + sync + open in Xcode, then press ▶ Run
```

---

## 4. Android

Requires **Android Studio**.

```bash
npx cap add android    # one time — generates the ./android project
npm run android        # build + sync + open in Android Studio, then press ▶ Run
```

Create an emulator in Android Studio's **Device Manager**, or connect a device
with USB debugging enabled.

---

## 5. The everyday loop (native)

After editing React code in `src/`, push it into the native projects:

```bash
npm run build && npx cap sync      # syncs both ios and android
```

…then press **Run** in Xcode / Android Studio. Or use the one-shot scripts
`npm run ios` / `npm run android`.

---

## 6. Environment variables

The app runs fully offline against mock data — **no env vars needed** to start.
When you add a real backend, use Vite's convention: put values in `.env`
(gitignored) prefixed with `VITE_`, and read them via
`import.meta.env.VITE_MY_KEY`.

---

## 7. Scripts reference

| Command             | What it does                       |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Vite dev server (web)              |
| `npm run build`     | Type-check + production web build  |
| `npm run preview`   | Preview the production build       |
| `npm run ios`       | Build + sync + open Xcode          |
| `npm run android`   | Build + sync + open Android Studio |
| `npm run typecheck` | `tsc --noEmit`                     |
| `npm run lint`      | ESLint                             |
| `npm test`          | Vitest unit + component tests      |
| `npm run test:e2e`  | Playwright end-to-end tests        |
| `npm run format`    | Prettier                           |
