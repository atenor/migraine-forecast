import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        calm: {
          bg:       "#050d1a",
          navy:     "#0a1628",
          teal:     "#4ecdc4",
          lavender: "#a89ec9",
          gold:     "#f0c27f",
          mist:     "#7a9ab8",
          rose:     "#c85a5a",
          terra:    "#e07b54",
          /* Restorative risk palette — health-app warm */
          sage:     "#86d4a4",  // low / clear      — healing green
          honey:    "#e8c485",  // moderate         — warm honey
          clay:     "#dd9876",  // high             — warm clay
          dusk:     "#cf7d8a",  // very-high        — dusty rose
        },
      },
      fontFamily: {
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
