import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          950: "#0d0a1e",
          900: "#13103a",
          800: "#1a1650",
          700: "#231f6e",
          600: "#2d2894",
        },
        lime: {
          300: "#bef264",
          400: "#a3e635",
          500: "#84cc16",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
