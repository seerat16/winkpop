import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Bundle ID — matches App Store / Play Store identifier.
  appId: "app.winkpop",
  appName: "WinKPop",
  // Vite's build output directory.
  webDir: "dist",
  // During development you can point to the Vite dev server so the native
  // shell hot-reloads alongside the browser. Remove / comment out for
  // production builds.
  // server: {
  //   url: "http://YOUR_LOCAL_IP:5173",
  //   cleartext: true,
  // },
};

export default config;
