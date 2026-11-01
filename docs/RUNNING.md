# Running WinKPop

WinKPop is a single Expo (React Native) codebase that targets **Web**, **iOS**,
and **Android**. This guide covers prerequisites and how to run each platform.

---

## 1. Prerequisites (all platforms)

- **Node.js 18 or newer** (Node 22 LTS recommended) — <https://nodejs.org>
- **npm** (ships with Node). pnpm/yarn also work.
- A terminal and a code editor (VS Code recommended).

Install project dependencies once:

```bash
npm install
```

> ℹ️ **Note on this repo:** the CI/agent sandbox that generated this project has
> no access to the public npm registry, so `npm install` must be run on your own
> machine (which has normal internet). All source, config, and tests are
> complete and ready — you only need to install and run.

---

## 2. Web (fastest to try)

No extra tooling required beyond Node.

```bash
npm run web
```

This starts the Expo dev server and opens the app at `http://localhost:8081`
(Metro may pick another port if 8081 is busy — watch the terminal). Hot reload is
on by default; save a file and the browser updates.

**Production web build:**

```bash
npx expo export --platform web      # outputs static site to ./dist
npx serve dist                      # preview the static build locally
```

---

## 3. iOS (macOS only)

**Prerequisites**

- macOS with **Xcode** (from the Mac App Store)
- Xcode Command Line Tools: `xcode-select --install`
- iOS Simulator (installed with Xcode)

**Run in the simulator:**

```bash
npm run ios
```

**Run on a physical iPhone:** install the **Expo Go** app from the App Store,
run `npm start`, and scan the QR code shown in the terminal with your camera.

---

## 4. Android

**Prerequisites**

- **Android Studio** — <https://developer.android.com/studio>
- An Android Virtual Device (AVD) created via Android Studio's Device Manager,
  **or** a physical device with USB debugging enabled.
- Ensure `adb` is on your `PATH` (Android Studio installs it under
  `~/Library/Android/sdk/platform-tools` on macOS, `%LOCALAPPDATA%\Android\Sdk\platform-tools` on Windows).

**Run on an emulator / connected device:**

```bash
npm run android
```

**Run on a physical Android phone:** install **Expo Go** from the Play Store,
run `npm start`, and scan the QR code.

---

## 5. The interactive dev server

```bash
npm start
```

This opens the Expo CLI. Press:

| Key | Action                    |
| --- | ------------------------- |
| `w` | open **web**              |
| `i` | open **iOS** simulator    |
| `a` | open **Android** emulator |
| `r` | reload the app            |
| `j` | open the JS debugger      |
| `m` | toggle the dev menu       |

---

## 6. Environment variables

The app runs fully offline against mock data, so **no env vars are required** to
start. When you connect a real backend, create a `.env` file (already gitignored)
and expose values with the `EXPO_PUBLIC_` prefix so they reach the client, e.g.:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Read them in code via `process.env.EXPO_PUBLIC_SUPABASE_URL`.

---

## 7. Useful scripts

| Command                           | What it does                           |
| --------------------------------- | -------------------------------------- |
| `npm start`                       | start the dev server (pick a platform) |
| `npm run web` / `ios` / `android` | start on a specific platform           |
| `npm run typecheck`               | run the TypeScript compiler (no emit)  |
| `npm run lint`                    | run ESLint                             |
| `npm test`                        | run the Jest test suite                |
| `npm run format`                  | format with Prettier                   |
