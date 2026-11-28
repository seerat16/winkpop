/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wink: {
          pink: "#D4759A",
          "pink-soft": "#E880A4",
          "pink-tint": "#FFF0F7",
          "pink-border": "#F0D8E8",
          purple: "#7C3AED",
          "purple-soft": "#C9A8E0",
          "purple-tint": "#F3EDFB",
          mint: "#5CC0A8",
          "mint-soft": "#B8EAD8",
          "mint-tint": "#EDFAF5",
          sky: "#7BBFEA",
          ink: "#2D2D2D",
          muted: "#9A9A9A",
          warn: "#F4A07C",
        },
      },
      borderRadius: {
        card: "16px",
        pill: "9999px",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
