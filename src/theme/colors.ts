/**
 * WinKPop design tokens.
 *
 * Keep this file in sync with `tailwind.config.js`. Components should prefer
 * Tailwind classes (e.g. `text-wink-pink`); use these constants only where a
 * raw color string is required (SVG fills, gradients, chart colors, etc.).
 */
export const colors = {
  pink: "#D4759A",
  pinkSoft: "#E880A4",
  pinkTint: "#FFF0F7",
  pinkBorder: "#F0D8E8",

  purple: "#7C3AED",
  purpleSoft: "#C9A8E0",
  purpleTint: "#F3EDFB",

  mint: "#5CC0A8",
  mintSoft: "#B8EAD8",
  mintTint: "#EDFAF5",

  sky: "#7BBFEA",

  ink: "#2D2D2D",
  muted: "#9A9A9A",
  warn: "#F4A07C",

  white: "#FFFFFF",
  bg: "#FFFFFF",
  bgTint: "#FBF7FE",
} as const;

/** Signature tri-tone WinKPop gradient (pink → purple → sky). */
export const brandGradient = [colors.pinkSoft, colors.purpleSoft, colors.sky];

export type ColorToken = keyof typeof colors;
