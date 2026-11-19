import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Capacitor serves the app from a file:// URL on native, so relative paths
  // are needed. For the browser dev server "/" is fine.
  base: "./",
  build: {
    outDir: "dist",
  },
});
