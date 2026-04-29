import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          mint: "#4BE39E",
          sky: "#38BDF8",
          sun: "#FDBA3B",
          rose: "#FB7185",
          night: "#0A1020"
        }
      },
      boxShadow: {
        glass: "0 20px 60px rgba(8, 24, 52, 0.2)"
      },
      borderRadius: {
        soft: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
