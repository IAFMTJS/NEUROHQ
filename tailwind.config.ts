import type { Config } from "tailwindcss";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const config: Config = {
  content: [
    path.join(projectRoot, "app", "**", "*.{js,ts,jsx,tsx,mdx}"),
    path.join(projectRoot, "components", "**", "*.{js,ts,jsx,tsx,mdx}"),
    path.join(projectRoot, "pages", "**", "*.{js,ts,jsx,tsx,mdx}"),
    path.join(projectRoot, "hooks", "**", "*.{js,ts,jsx,tsx,mdx}"),
    path.join(projectRoot, "lib", "**", "*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        /* NEUROHQ design tokens */
        hq: {
          "bg-primary": "var(--bg-primary)",
          "bg-surface": "var(--bg-surface)",
          "bg-elevated": "var(--bg-elevated)",
          "bg-overlay": "var(--bg-overlay)",
          "accent-focus": "var(--accent-focus)",
          "accent-energy": "var(--accent-energy)",
          "accent-warning": "var(--accent-warning)",
          "accent-neutral": "var(--accent-neutral)",
          "text-primary": "var(--text-primary)",
          "text-secondary": "var(--text-secondary)",
          "text-muted": "var(--text-muted)",
        },
        /* Legacy neuro palette (mapped to tokens) */
        neuro: {
          silver: "var(--text-primary)",
          blue: "var(--accent-focus)",
          "blue-light": "#79c0ff",
          dark: "var(--bg-primary)",
          surface: "var(--bg-surface)",
          border: "var(--accent-neutral)",
          muted: "var(--text-muted)",
        },
      },
      boxShadow: {
        "glow-focus": "var(--glow-focus)",
        "glow-energy": "var(--glow-energy)",
        "glow-warning": "var(--glow-warning)",
        "glow-neutral": "var(--glow-neutral)",
      },
      borderRadius: {
        "hq-card": "var(--hq-card-radius)",
        "hq-btn": "var(--hq-btn-radius)",
      },
      animation: {
        "hq-fade-up": "hq-fade-up 400ms ease-out forwards",
        "hq-radial-fill": "hq-radial-fill 600ms ease-out forwards",
      },
      keyframes: {
        "hq-fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "hq-radial-fill": {
          "0%": { strokeDashoffset: "var(--circle-circumference)" },
          "100%": { strokeDashoffset: "var(--circle-offset)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
