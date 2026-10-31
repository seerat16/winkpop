# Debugging WinKPop

How to inspect, log, and fix issues across Web, iOS, and Android.

---

## 1. The dev menu

While the app is running in development, open the **dev menu**:

- **Web:** it's a toolbar in the browser / press `m` in the terminal
- **iOS simulator:** `Cmd + D`
- **Android emulator:** `Cmd + M` (macOS) or `Ctrl + M` (Windows/Linux)
- **Physical device:** shake the phone

From here you can **Reload**, **toggle the element inspector**, enable
**Performance monitor**, and open the **JS debugger**.

---

## 2. Logging

`console.log` / `console.warn` / `console.error` all stream to the terminal
running the Expo dev server, and to the browser console on Web.

For richer inspection, open **React Native DevTools** (Hermes): press `j` in the
Expo CLI terminal. This gives you a Chrome-DevTools-style console, sources, and
breakpoints that work on native and web.

---

## 3. Inspecting state (Zustand)

The user/session lives in `src/data/userStore.ts`. To watch it during
development, log inside a component:

```ts
const user = useUserStore((s) => s.user);
console.log("current user", user);
```

…or subscribe once at the module level for a running trace:

```ts
useUserStore.subscribe((state) => console.log("store →", state.user));
```

Persisted state is stored under the key `winkpop-user` in AsyncStorage
(localStorage on Web — inspect it under the browser's Application tab).

---

## 4. Inspecting layout & styles

NativeWind compiles Tailwind classes to styles. To debug layout:

- **Web:** use the browser's element inspector — classes resolve to normal CSS.
- **Native:** open the dev menu → **Toggle Element Inspector**, then tap any
  element to see its box model and resolved styles.

If a `className` seems ignored, confirm the file path is covered by the `content`
globs in `tailwind.config.js` (currently `./app/**` and `./src/**`).

---

## 5. Common errors & fixes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Unable to resolve module @/...` | Metro cache is stale after adding a file | Restart with `npx expo start -c` (clears cache) |
| Tailwind classes have no effect | File not matched by `content` globs, or Metro cache | Check `tailwind.config.js`; restart with `-c` |
| Blank white screen on launch | A render-time throw before first paint | Check the terminal/console for the stack trace |
| `Port 8081 already in use` | A previous dev server is still running | Kill it, or let Expo pick another port |
| iOS build fails after dependency change | Native cache | `npx expo start -c`; for bare workflow, `cd ios && pod install` |
| Android emulator can't reach Metro | ADB reverse not set | `adb reverse tcp:8081 tcp:8081`, then reload |
| Fonts look like the system default | Custom font not loaded | Fonts fall back to `System` by design until you add `expo-font` assets |

**Clear all caches (the "turn it off and on again"):**

```bash
npx expo start -c            # clears Metro's transform cache
rm -rf node_modules && npm install   # nuclear option for dependency weirdness
```

---

## 6. Debugging the data layer in isolation

The pure logic in `src/data/` (search, price history) has **no React Native
dependencies**, so you can run and debug it with plain Node + the test runner:

```bash
npm test -- search          # run just the search tests
npm test -- --watch         # re-run on change while you poke at logic
```

Because `searchPhotocards` and the price functions are pure, the fastest way to
debug a filtering bug is to add a focused test case in
`src/data/__tests__/` reproducing the input, then step through it.

---

## 7. Type errors

Run the compiler to surface type problems the editor might miss:

```bash
npm run typecheck
```

This catches route typos too — Expo Router generates typed routes
(`experiments.typedRoutes` in `app.json`), so an invalid `router.push("/wrong")`
becomes a compile error.
