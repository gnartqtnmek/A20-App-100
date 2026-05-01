import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1a4173",
        "primary-container": "#1a4173",
        background: "#faf9fe",
        surface: "#faf9fe",
        success: "#2e7d32",
        info: "#0288d1",
        error: "#ba1a1a",
        outline: "#c3c6d0"
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0,0,0,0.05)"
      },
      borderRadius: {
        soft: "0.75rem"
      }
    }
  },
  plugins: []
};

export default config;
