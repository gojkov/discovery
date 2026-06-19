import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#030305",
        cream: "#f6f7fb",
        acid: "#b7ff3c",
        coral: "#ff477e",
        violet: "#8b5cff",
        mist: "#52e5ff",
        night: "#07070b",
        panel: "#0d0d14",
        cyan: "#46e8ff",
        pink: "#ff3cac"
      },
      boxShadow: {
        card: "0 24px 80px rgba(0, 0, 0, 0.42)",
        neon: "0 0 40px rgba(70, 232, 255, 0.14)"
      }
    }
  },
  plugins: []
} satisfies Config;
