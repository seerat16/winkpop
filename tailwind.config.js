/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: update this list if you add directories that contain className usage.
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // WinKPop brand palette — kawaii pastel, derived from the logo + mascots.
        wink: {
          // primary rose/pink accent used for CTAs and active states
          pink: "#D4759A",
          "pink-soft": "#E880A4",
          "pink-tint": "#FFF0F7",
          "pink-border": "#F0D8E8",
          // secondary purple (logo background / brand violet)
          purple: "#7C3AED",
          "purple-soft": "#C9A8E0",
          "purple-tint": "#F3EDFB",
          // mint — mascot + "add to cart" success accent
          mint: "#5CC0A8",
          "mint-soft": "#B8EAD8",
          "mint-tint": "#EDFAF5",
          // sky blue — tri-tone gradient tail
          sky: "#7BBFEA",
          // supporting neutrals
          ink: "#2D2D2D",
          muted: "#9A9A9A",
          warn: "#F4A07C",
        },
      },
      fontFamily: {
        // Rounded, friendly type to match the "winkpop" wordmark.
        display: ["Poppins_700Bold", "System"],
        sans: ["Poppins_400Regular", "System"],
      },
      borderRadius: {
        card: "16px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
