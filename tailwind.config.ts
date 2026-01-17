import type { Config } from "tailwindcss";

export default {
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
        sage: {
          50: "var(--sage-50)",
          100: "var(--sage-100)",
          200: "var(--sage-200)",
          300: "var(--sage-300)",
          400: "var(--sage-400)",
          500: "var(--sage-500)",
          600: "var(--sage-600)",
          700: "var(--sage-700)",
          800: "var(--sage-800)",
          900: "var(--sage-900)",
          light: "var(--sage-light)",
          DEFAULT: "var(--sage-400)",
        },
        coral: {
          300: "var(--coral-300)",
          400: "var(--coral-400)",
          500: "var(--coral-500)",
          light: "var(--coral-light)",
          DEFAULT: "var(--coral-400)",
        },
        terracotta: {
          50: "var(--terracotta-50)",
          100: "var(--terracotta-100)",
          200: "var(--terracotta-200)",
          300: "var(--terracotta-300)",
          400: "var(--terracotta-400)",
          500: "var(--terracotta-500)",
          600: "var(--terracotta-600)",
          DEFAULT: "var(--terracotta-400)",
        },
        sand: {
          100: "var(--sand-100)",
          200: "var(--sand-200)",
        },
        clay: {
          100: "var(--clay-100)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          dark: "var(--muted-dark)",
          foreground: "var(--muted-foreground)",
        },
        border: "var(--border)",
      },
      borderRadius: {
        pill: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "pillowy-sm": "var(--shadow-pillowy-sm)",
        "pillowy": "var(--shadow-pillowy)",
        "pillowy-lg": "var(--shadow-pillowy-lg)",
        "pillowy-colored": "var(--shadow-pillowy-colored)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
} satisfies Config;
