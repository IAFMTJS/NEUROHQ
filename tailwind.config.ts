import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        neuro: {
          silver: "#e6edf3",
          blue: "#58a6ff",
          "blue-light": "#79c0ff",
          dark: "#0d1117",
          surface: "#161b22",
          border: "#21262d",
          muted: "#8b949e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
