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
        background: {
          DEFAULT: "#0a0a0a",
          elevated: "#111111",
          surface: "#1a1a1a",
        },
        green: {
          primary: "#10b981",
          dark: "#059669",
          accent: "#34d399",
          light: "#6ee7b7",
          glow: "rgba(16, 185, 129, 0.1)",
        },
        text: {
          primary: "#f9fafb",
          secondary: "#d1d5db",
          muted: "#9ca3af",
          dim: "#6b7280",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.1)",
          green: "rgba(16, 185, 129, 0.2)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      spacing: {
        section: "8rem",
        "section-sm": "4rem",
      },
      borderRadius: {
        card: "0.75rem",
        button: "0.5rem",
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
        glow: "0 0 20px rgba(16, 185, 129, 0.3)",
        "glow-sm": "0 0 10px rgba(16, 185, 129, 0.2)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
