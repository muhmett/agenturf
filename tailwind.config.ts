import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium dark base
        ink: {
          950: "#050506",
          900: "#0a0a0c",
          800: "#111114",
          700: "#191920",
          600: "#22222b",
          500: "#2c2c37",
        },
        // Luxury gold accent
        gold: {
          50: "#fbf7ec",
          200: "#efd9a3",
          400: "#e2bd6a",
          500: "#d4a537",
          600: "#b8862a",
          700: "#8f6720",
        },
        // Racing green accent
        racing: {
          400: "#2fbf71",
          500: "#178a4c",
          600: "#0f6b3a",
          700: "#0a4f2b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(212,165,55,0.25), 0 8px 40px -12px rgba(212,165,55,0.35)",
        panel: "0 20px 60px -20px rgba(0,0,0,0.8)",
      },
      backgroundImage: {
        "gold-sheen":
          "linear-gradient(120deg, #b8862a 0%, #e2bd6a 40%, #fbf7ec 50%, #e2bd6a 60%, #b8862a 100%)",
        "radial-spot":
          "radial-gradient(1200px 600px at 50% -10%, rgba(212,165,55,0.10), transparent 60%)",
      },
      keyframes: {
        gallop: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-3px) rotate(-2deg)" },
        },
        sheen: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        radar: {
          "0%": { transform: "scale(0.6)", opacity: "0.9" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        gallop: "gallop 0.6s ease-in-out infinite",
        sheen: "sheen 3s linear infinite",
        radar: "radar 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
