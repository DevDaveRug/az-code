import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        statut: {
          nouveau: "#3b82f6",
          encours: "#f97316",
          gagne: "#22c55e",
          perdu: "#94a3b8"
        }
      }
    }
  },
  plugins: []
};

export default config;
