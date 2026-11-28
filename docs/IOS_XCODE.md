# Testing WinKPop on iOS with Xcode

A complete, step-by-step guide to running and testing the app on the **iOS
Simulator** and on a **physical iPhone** using **Xcode 26** (the current stable
release; Xcode 27 is still in beta — the steps below are identical on it).

WinKPop is a React web app wrapped by **Capacitor**. Capacitor generates a real
native Xcode project under `ios/` that loads your compiled web app. You build
the web app, sync it into the native project, then run it from Xcode.

---

## 1. One-time prerequisites

1. **A Mac.** iOS development is macOS-only — there is no way around this.
2. **Xcode 26** — install from the Mac App Store (large, ~10–15 GB). Open it
   once and accept the license prompt.
3. **Command Line Tools:**
   ```bash
   xcode-select --install
   ```
4. **An iOS Simulator runtime:** Xcode → **Settings → Components** (called
   _Platforms_ in some versions) → install an **iOS 26** simulator runtime if
   one isn't already there.
5. **CocoaPods** (Capacitor uses it to install native deps):
   ```bash
   sudo gem install cocoapods
   # Apple-silicon Macs, if the above is slow/odd: brew install cocoapods
   ```
6. **Node 18+** and the project installed:
   ```bash
   git clone https://github.com/seerat16/winkpop.git
   cd winkpop
   npm install
   ```

---

## 2. Add the iOS platform (one time)

The `ios/` native project isn't committed to the repo — you generate it locally:

```bash
npm run build                  # compile the React app into dist/
npx cap add ios                # creates the ./ios Xcode project + runs pod install
```

You now have an `ios/App/App.xcworkspace` — a real Xcode project.

> If `npx cap add ios` reports a CocoaPods error, run `cd ios/App && pod install`
> manually, then `cd ../..`.

---

## 3. Run on the iOS Simulator

Each time you change the web code, rebuild and sync, then open Xcode:

```bash
npm run build          # rebuild the web app
npx cap sync ios       # copy dist/ into the native project
npx cap open ios       # open the workspace in Xcode
```

Or do all three with the shortcut script:

```bash
npm run ios
```

**In Xcode:**

1. At the top, next to the ▶ button, click the device selector and pick a
   simulator, e.g. **iPhone 16** (any iPhone 26.x runtime).
2. Press **▶ Run** (or `Cmd + R`).
3. The simulator boots and WinKPop launches. You'll see the **login screen** →
   tap **"Explore as demo collector"**.

---

## 4. What to check once it's running

Walk the core journey:

1. **Discover** — the personalised home feed.
2. **Browse** — filter photocards by **group → member → era → type → price**.
3. Tap a **card** → the **price-intelligence** chart (low / avg / high / last).
4. **Add to cart** → open the **cart** → the **5% buyer-protection** total.
5. **Wishlist / Transactions / Profile** tabs along the bottom.

Everything persists across app restarts (saved to the WebView's local storage).

---

## 5. Run on a physical iPhone

1. Connect your iPhone via USB and **trust** the computer when prompted.
2. In Xcode's device selector, choose your iPhone instead of a simulator.
3. **Signing:** select the **App** target → **Signing & Capabilities** tab →
   check **Automatically manage signing** → pick your **Team** (a free personal
   Apple ID works for on-device testing).
4. If the bundle id `app.winkpop` is taken, change it to something unique like
   `com.yourname.winkpop` (also update `appId` in `capacitor.config.ts`).
5. Press **▶ Run**. The first install, go to iPhone **Settings → General → VPN &
   Device Management** and **trust** your developer certificate, then relaunch.

---

## 6. Live reload during development (optional, faster)

Instead of rebuilding for every change, point the native shell at the Vite dev
server so it hot-reloads:

1. Find your Mac's LAN IP: `ipconfig getifaddr en0`
2. In `capacitor.config.ts`, uncomment the `server` block and set the URL:
   ```ts
   server: { url: "http://192.168.x.x:5173", cleartext: true },
   ```
3. Run `npm run dev` (keep it running), then `npx cap sync ios && npx cap open ios`
   and press Run. The app now reloads as you edit.
4. **Remember to revert** the `server` block before a production build.

---

## 7. Automated UI tests in Xcode (XCUITest)

Capacitor's iOS project is a normal Xcode project, so you can add Apple's native
UI tests:

1. In Xcode: **File → New → Target… → UI Testing Bundle**.
2. Write an `XCTestCase` that launches the app and asserts on elements, e.g.:
   ```swift
   import XCTest

   final class SmokeUITests: XCTestCase {
     func testDemoLoginReachesDiscover() {
       let app = XCUIApplication()
       app.launch()
       app.webViews.staticTexts["Explore as demo collector"].tap()
       XCTAssertTrue(app.webViews.staticTexts["Discover"].waitForExistence(timeout: 10))
     }
   }
   ```
   > WebView content is reached through `app.webViews…`. For richer assertions,
   > the cross-platform **Playwright** suite (`npm run test:e2e`) already covers
   > the same journeys against the web build and is the recommended first line of
   > UI testing.
3. Run tests with **Product → Test** (`Cmd + U`), or from the terminal:
   ```bash
   xcodebuild test \
     -workspace ios/App/App.xcworkspace \
     -scheme App \
     -destination 'platform=iOS Simulator,name=iPhone 16'
   ```

---

## 8. Common Xcode / Capacitor issues

| Problem                                                                           | Fix                                                                                                                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| "deployment target 14.0 … range 15.0–27.x" (×8)                                   | **Warnings, not errors** — the build still runs. Fix with `npm run ios:fix`, then rebuild. See §10.                                         |
| "[CP] Embed Pods Frameworks … run during every build"                             | Harmless CocoaPods warning — safe to ignore.                                                                                                |
| Builds but crashes at launch: "UIScene life cycle is required"                    | iOS 26/27 SDK needs scene adoption (Capacitor 8.5+) — upgrade & regenerate the iOS project. See §11.                                        |
| "Missing package product 'CapApp-SPM'" / "Failed to resolve package dependencies" | Capacitor 8 uses Swift Package Manager — Xcode just needs to resolve it: **File → Packages → Resolve Package Versions**, then Run. See §12. |
| `npx cap add ios` fails on pods                                                   | `cd ios/App && pod install`                                                                                                                 |
| App shows a blank white screen                                                    | You forgot `npm run build` before `npx cap sync` — rebuild and sync                                                                         |
| Changes don't appear                                                              | Re-run `npm run build && npx cap sync ios` (or use live reload §6)                                                                          |
| "No account for team" / signing error                                             | Signing & Capabilities → pick your Team; change bundle id if taken                                                                          |
| "Unable to find a destination" / no simulator                                     | Install an iOS runtime in Xcode → Settings → Components                                                                                     |
| CocoaPods not found                                                               | `sudo gem install cocoapods` (or `brew install cocoapods`)                                                                                  |
| Pods out of date after dependency change                                          | `cd ios/App && pod install && cd ../..`                                                                                                     |

---

## 9. The everyday loop, summarised

```bash
# edit React code in src/ …
npm run build && npx cap sync ios   # push changes into the native project
# press ▶ Run in Xcode
```

That's it — you're testing the real iOS app built from your React codebase.

---

## 10. Fixing the iOS deployment-target warnings

After `npx cap add ios`, Xcode 26/27 shows a batch of warnings like:

> The iOS Simulator deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is set to
> 14.0, but the range of supported deployment target versions is 15.0 to 27.x.

**These are warnings, not errors** — the app still builds and runs. They happen
because Capacitor 7's template defaults pods and the app target to iOS 14.0,
while recent Xcode only supports 15.0+.

**Fix (one command):**

```bash
npm run ios:fix
```

This runs `scripts/fix-ios-deployment-target.mjs`, which:

1. Bumps `IPHONEOS_DEPLOYMENT_TARGET` to **15.1** in the app's Xcode project, and
2. Adds a Podfile `post_install` hook pinning every pod to 15.1, then runs
   `pod install`.

It's idempotent and already wired into `npm run ios`, so after the first
`npx cap add ios` the normal flow keeps it fixed automatically. In Xcode, press
**▶ Run** again and the warnings are gone.

> Prefer to do it by hand? In Xcode: select the **App** project → each target →
> **Build Settings** → set **iOS Deployment Target** to **15.1**, and do the same
> for the **Pods** project. The script just automates this.

---

## 11. "UIScene life cycle is required" launch crash (Xcode 26/27)

If the app builds but **crashes immediately on launch** with:

> Application failed to launch: UIScene life cycle is required for apps built
> with this SDK.

…your Xcode is building against the **iOS 26/27 SDK**, which requires apps to
adopt the UIScene lifecycle. **Capacitor 7's iOS template doesn't** — Capacitor
**8.5** is the first version to adopt scenes.

### Fix: upgrade to Capacitor 8.5+ and regenerate the iOS project

`package.json` in this repo is already on Capacitor `^8.5.0`. If your local
`ios/` folder was generated by an older Capacitor, regenerate it:

```bash
git pull origin rebuild-expo-app
rm -rf node_modules package-lock.json
npm install                     # installs Capacitor 8.5+

rm -rf ios                      # drop the old (v7-generated) native project
npm run build
npx cap add ios                 # regenerate from the v8.5 template (adopts scenes)
npm run ios:fix                 # bump deployment target + ensure scene manifest
npx cap open ios                # Run ▶ — the app now launches
```

### Why regenerate?

Bumping the Capacitor dependency alone does **not** migrate an already-generated
project — the native `ios/` project itself has to adopt scenes. Regenerating
from the 8.5 template is the cleanest way to get the scene-enabled
`AppDelegate` / `SceneDelegate` and the `UIApplicationSceneManifest` in
`Info.plist`.

> **Safety net:** `npm run ios:fix` also injects a `UIApplicationSceneManifest`
> into `Info.plist` if one is missing, so even a partially-migrated project will
> launch.

---

## 12. "Missing package product 'CapApp-SPM'" (Swift Package Manager)

Capacitor 8 uses **Swift Package Manager (SPM)** instead of CocoaPods for the iOS
project. It generates a local package called **`CapApp-SPM`** that references all
your native dependencies. If Xcode shows:

> Failed to resolve package dependencies
> Missing package product 'CapApp-SPM'

…it just means Xcode hasn't resolved the Swift packages yet. Fix it from within
Xcode, in order — stop as soon as the build succeeds:

1. **File → Packages → Resolve Package Versions.** Wait for the status bar to
   finish, then press **▶ Run**.
2. Still failing? **File → Packages → Reset Package Caches**, wait, then Resolve
   Package Versions again, then Run.
3. Still failing? **Product → Clean Build Folder** (`Shift + Cmd + K`), then Run.
4. **Resolve from the command line** — the most reliable fix. This fetches
   `capacitor-swift-pm` and wires up `CapApp-SPM` directly, and prints the real
   error if something is actually wrong:
   ```bash
   xcodebuild -resolvePackageDependencies -project ios/App/App.xcodeproj -scheme App
   ```
   A healthy result ends with `Resolved source packages: capacitor-swift-pm …,
CapApp-SPM … @ local`. Then go to Xcode, pick a simulator, and Run.
5. Last resort — wipe every SPM cache, then reopen:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   rm -rf ~/Library/Caches/org.swift.swiftpm ~/Library/org.swift.swiftpm
   rm -rf ios/App/.swiftpm ios/App/CapApp-SPM/.swiftpm
   npx cap open ios
   ```

> **Is it a network problem?** SPM must reach GitHub to download
> `capacitor-swift-pm` the first time. Test with
> `curl -I https://github.com/ionic-team/capacitor-swift-pm.git` — a `301`/`200`
> means GitHub is reachable (so it's a stuck cache, use steps above). A hang or
> failure means a VPN/firewall is blocking it — disconnect the VPN and retry.

**Sanity checks:**

- You should be running the project `npx cap open ios` opened — the Xcode title
  bar reads **App**. Don't open a stray `.xcworkspace` from an old CocoaPods run;
  if `ios/App/App.xcworkspace` exists from a previous attempt, delete the whole
  `ios/` folder and re-run `npx cap add ios` for a clean SPM project.
- `npx cap doctor` prints your Capacitor + platform versions and flags common
  problems — run it if things look inconsistent.

> **Note:** with Capacitor 8 + SPM there is **no Podfile**, so the
> `npm run ios:fix` script's "pod install" / Podfile step simply no-ops. The
> deployment-target and scene-manifest patches still apply to the Xcode project
> and Info.plist, which is what matters.
