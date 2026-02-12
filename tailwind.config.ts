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
        // NEUROHQ brand: silver/grey + blue accent (see Logo Naam)
        neuro: {
          silver: "#c0c0c0",
          blue: "#3b82f6",
          dark: "#0a0a0a",
          surface: "#141414",
        },
      },
    },
  },
  plugins: [],
};

export default config;
