import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        elevated: "var(--surface-elevated)",
        border: "var(--border)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        muted: "var(--muted)",
      },
      borderRadius: {
        xl: "14px",
      },
      boxShadow: {
        glow: "0 0 32px rgba(34, 211, 238, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
