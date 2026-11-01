# Native E2E (Maestro)

These flows drive the **iOS simulator** and **Android emulator** using
[Maestro](https://maestro.mobile.dev) — a free, open-source mobile UI testing
tool that reads simple YAML flows.

## Install Maestro (one time)

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

## Run the flows

1. Start the app on a simulator/emulator in one terminal:
   ```bash
   npm run ios      # or: npm run android
   ```
2. Run a flow in another terminal:
   ```bash
   maestro test e2e/native/flows/login.yaml
   maestro test e2e/native/flows/browse-and-cart.yaml
   ```
   Or run the whole suite:
   ```bash
   maestro test e2e/native/flows
   ```

The `appId` in each flow is `com.winkpop.app` (matches `app.json`). For Expo Go
during development, launch the app manually first, then run the flow — Maestro
attaches to whatever is in the foreground.
