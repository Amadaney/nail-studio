import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF8F5",
        sand: "#F1EBE5",
        blush: "#D8B2A3",
        nude: "#C9A99B",
        cocoa: "#89766B",
        stone: "#77716D",
        ink: "#292624",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: { soft: "0 8px 30px rgba(137,118,107,0.12)" },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
