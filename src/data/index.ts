/**
 * Data layer barrel.
 *
 * Screens import from `@/data` rather than individual files so the underlying
 * source (mock today, a real API later) can change without touching the UI.
 */
export * from "./types";
export * from "./groups";
export * from "./photocards";
export * from "./catalog";
export * from "./search";
export * from "./priceHistory";
export * from "./transactions";
export * from "./community";
export * from "./commerce";
export * from "./seed";
export { useUserStore, DEFAULT_USER } from "./userStore";
export { useAppStore, getAnyListing, allListings, listingName, uid, EMPTY } from "./appStore";
