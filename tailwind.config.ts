import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "var(--font-display)",
          "var(--font-sans)",
          "ui-sans-serif",
          "sans-serif"
        ],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      colors: {
        // Surfaces — layered near-black with a cool cast.
        ink: "#07070b",
        night: "#0b0b12",
        panel: "#111119",
        raised: "#16161f",

        // Text — all AA-compliant on the dark surfaces above.
        fg: "#f5f5fa", // primary
        muted: "#b4b4c4", // secondary (~7:1)
        subtle: "#9494a6", // tertiary (~4.9:1, normal-text AA)

        // Accents — vibrant but readable as text on dark.
        cyan: "#5cd6ff",
        lime: "#b6ff5c",
        coral: "#ff5c7a",
        violet: "#a181ff",
        pink: "#ff5cc0",
        amber: "#ffc55c",

        // Back-compat aliases used in older markup (mapped to the new scale).
        cream: "#f5f5fa",
        acid: "#b6ff5c",
        mist: "#5cd6ff"
      },
      boxShadow: {
        card: "0 18px 50px -18px rgba(0, 0, 0, 0.7)",
        glow: "0 0 32px -6px rgba(92, 214, 255, 0.35)"
      },
      borderRadius: {
        "4xl": "1.75rem",
        "5xl": "2.25rem"
      },
      letterSpacing: {
        eyebrow: "0.22em"
      }
    }
  },
  plugins: []
} satisfies Config;
