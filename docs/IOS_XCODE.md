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
npm install @capacitor/ios     # iOS platform package
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

| Problem                                       | Fix                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `npx cap add ios` fails on pods               | `cd ios/App && pod install`                                         |
| App shows a blank white screen                | You forgot `npm run build` before `npx cap sync` — rebuild and sync |
| Changes don't appear                          | Re-run `npm run build && npx cap sync ios` (or use live reload §6)  |
| "No account for team" / signing error         | Signing & Capabilities → pick your Team; change bundle id if taken  |
| "Unable to find a destination" / no simulator | Install an iOS runtime in Xcode → Settings → Components             |
| CocoaPods not found                           | `sudo gem install cocoapods` (or `brew install cocoapods`)          |
| Pods out of date after dependency change      | `cd ios/App && pod install && cd ../..`                             |

---

## 9. The everyday loop, summarised

```bash
# edit React code in src/ …
npm run build && npx cap sync ios   # push changes into the native project
# press ▶ Run in Xcode
```

That's it — you're testing the real iOS app built from your React codebase.
