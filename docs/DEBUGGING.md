# Debugging WinKPop

---

## 1. Web (your main workflow)

Run `npm run dev` and use your browser's DevTools:

- **Console / Sources** — `console.log` and breakpoints work normally.
- **Application → Local Storage** — inspect the persisted store under the
  `winkpop-user` key (this is what Zustand saves).
- **Elements** — Tailwind classes resolve to normal CSS you can toggle live.
- **Device toolbar** (`Cmd/Ctrl + Shift + M`) — emulate an iPhone viewport,
  which is how the app looks on device.

---

## 2. Inspecting state (Zustand)

```ts
const user = useUserStore((s) => s.user);
console.log("user", user);

// one-off running trace:
useUserStore.subscribe((s) => console.log("store →", s.user));
```

Persisted under `winkpop-user` in localStorage. Clear it to reset:
`localStorage.removeItem("winkpop-user")` (or Application → Clear storage).

---

## 3. Debugging the iOS app's WebView (Safari)

The native app is a WebView, so you debug it with **desktop Safari**:

1. On the **Mac**: Safari → Settings → Advanced → check **Show Develop menu**.
2. In the **iOS Simulator**: Settings → Safari → Advanced → enable **Web
   Inspector** (on a device too).
3. Run the app from Xcode, then on the Mac open **Safari → Develop → [your
   device/simulator] → WinKPop**. You get a full Web Inspector (console,
   elements, network) attached to the running app.

Native-side logs (crashes, plugin errors) appear in **Xcode's console** at the
bottom while the app runs.

---

## 4. Common errors & fixes

| Symptom                          | Cause / fix                                                       |
| -------------------------------- | ----------------------------------------------------------------- |
| `Failed to resolve import "@/…"` | Path alias — ensure the file exists; restart `npm run dev`        |
| Tailwind classes do nothing      | File not matched by `content` globs in `tailwind.config.js`       |
| Blank page in browser            | Check the DevTools console for the first thrown error             |
| iOS app is blank                 | You synced without building — run `npm run build && npx cap sync` |
| iOS changes not showing          | Re-run `npm run build && npx cap sync ios`                        |
| Vite port already in use         | Stop the other server or run `npm run dev -- --port 5174`         |

---

## 5. Type errors & lint

```bash
npm run typecheck   # tsc --noEmit — catches type + route errors
npm run lint        # eslint
```

Run these before committing; CI runs them on every push.

---

## 6. Debugging the pure logic

The search and pricing logic in `src/data/` is pure (no React, no DOM), so the
fastest way to debug a filtering bug is a focused Vitest case:

```bash
npm run test:watch -- search
```

Add a test reproducing the input, then step through it.
