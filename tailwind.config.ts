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
          DEFAULT: "#000000",
          "near-black": "#0a0a0a",
          elevated: "#111111",
          surface: "#1a1a1a",
          "surface-elevated": "#222222",
        },
        green: {
          primary: "#10b981",
          dark: "#059669",
          darker: "#047857",
          accent: "#34d399",
          light: "#6ee7b7",
          lighter: "#a7f3d0",
          glow: "rgba(16, 185, 129, 0.1)",
          "glow-strong": "rgba(16, 185, 129, 0.2)",
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
        section: "12rem",
        "section-md": "8rem",
        "section-sm": "6rem",
        "section-xs": "4rem",
      },
      borderRadius: {
        card: "1rem",
        "card-sm": "0.75rem",
        button: "0.625rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)",
        "card-hover": "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
        "card-elevated": "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)",
        glow: "0 0 40px rgba(16, 185, 129, 0.4), 0 0 80px rgba(16, 185, 129, 0.2)",
        "glow-sm": "0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.1)",
        "glow-button": "0 0 20px rgba(16, 185, 129, 0.5), 0 4px 14px rgba(16, 185, 129, 0.3)",
        button: "0 4px 14px 0 rgba(16, 185, 129, 0.2)",
        "button-hover": "0 8px 20px 0 rgba(16, 185, 129, 0.3)",
      },
      letterSpacing: {
        tighter: "-0.02em",
        tight: "-0.01em",
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
