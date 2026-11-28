# App icon & splash sources

Generated from the winkpop wordmark. The iOS project already uses them
(`ios/App/App/Assets.xcassets`). When you add Android (`npx cap add android`),
generate every Android size from these files with:

```bash
npx @capacitor/assets generate --iconBackgroundColor '#FFFFFF' --splashBackgroundColor '#FFFFFF'
```
