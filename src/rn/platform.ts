/** Non-component platform helpers (kept out of index.tsx for React Fast Refresh). */

/** App column width (the shell is capped at max-w-md = 448px). */
export const Dimensions = {
  get: (_w: "window") => ({ width: Math.min(typeof window === "undefined" ? 390 : window.innerWidth, 448) }),
};

export const Linking = {
  openURL: (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    return Promise.resolve();
  },
};

export const Share = {
  share: async ({ message }: { message: string }) => {
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    if (nav.share) {
      await nav.share({ text: message }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(message).catch(() => undefined);
    }
  },
};
