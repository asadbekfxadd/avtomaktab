import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "rgb(var(--brand) / <alpha-value>)",
        mark: "rgb(var(--mark) / <alpha-value>)",
        asphalt: { DEFAULT: "#24282C", 700: "#33383D", 500: "#5B6168", 300: "#9AA0A6" },
        concrete: { DEFAULT: "#EDEFF1", 200: "#E1E4E8", 50: "#F7F8F9" },
        stop: "#D7262E",
        go: "#178A4E",
      },
      fontFamily: {
        display: ["Unbounded", "system-ui", "sans-serif"],
        sans: ["'Golos Text'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
