import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        basse: "#9CA3AF",
        moyenne: "#FBBF24",
        haute: "#F97316",
        critique: "#DC2626",
      },
    },
  },
  plugins: [],
};

export default config;
