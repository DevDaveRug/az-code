import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette souveraineté (charte Sales Closer)
        noir: "#0a0a0a",
        or: "#EAB222",
      },
    },
  },
  plugins: [],
};
export default config;
