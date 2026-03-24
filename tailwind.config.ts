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
          DEFAULT: "var(--bg-near-black)",
          "near-black": "var(--bg-near-black)",
          elevated: "var(--bg-elevated)",
          surface: "var(--bg-surface)",
          "surface-elevated": "color-mix(in srgb, var(--bg-surface) 85%, #000 15%)",
        },
        green: {
          primary: "#1a9d78",
          dark: "#158f6c",
          darker: "#127a5c",
          accent: "#3db892",
          light: "#5ec9a8",
          lighter: "#8fdcc4",
          glow: "rgba(26, 157, 120, 0.08)",
          "glow-strong": "rgba(26, 157, 120, 0.14)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          dim: "var(--text-dim)",
        },
        border: {
          DEFAULT: "var(--border)",
          green: "rgba(26, 157, 120, 0.18)",
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
        card: "0 1px 2px rgba(0, 0, 0, 0.22)",
        "card-hover": "0 12px 28px rgba(0, 0, 0, 0.28)",
        "card-elevated": "0 6px 18px rgba(0, 0, 0, 0.24)",
        glow: "0 0 24px rgba(26, 157, 120, 0.12)",
        "glow-sm": "0 0 12px rgba(26, 157, 120, 0.08)",
        "glow-button": "0 2px 8px rgba(0, 0, 0, 0.18)",
        button: "0 1px 3px rgba(0, 0, 0, 0.16)",
        "button-hover": "0 3px 10px rgba(0, 0, 0, 0.2)",
      },
      letterSpacing: {
        tighter: "-0.02em",
        tight: "-0.01em",
        label: "0.02em",
      },
      animation: {
        "fade-in": "fadeIn 0.45s ease-out",
        "slide-up": "slideUp 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
