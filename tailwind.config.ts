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
        ink: "#08090f",
        night: "#0d0e16",
        panel: "#12131c",
        raised: "#1a1b27",

        // Text — all AA-compliant on the dark surfaces above.
        fg: "#fafaff", // primary
        muted: "#d0d0dc", // secondary, intentionally bright
        subtle: "#b2b2c2", // tertiary, AA even at small sizes

        // Accents — vibrant but readable as text on dark.
        cyan: "#5cd6ff",
        lime: "#b6ff5c",
        coral: "#ff5c7a",
        violet: "#a181ff",
        pink: "#ff5cc0",
        amber: "#ffc55c",

        // Back-compat aliases used in older markup (mapped to the new scale).
        cream: "#fafaff",
        acid: "#b6ff5c",
        mist: "#5cd6ff"
      },
      boxShadow: {
        card: "0 24px 70px -28px rgba(0, 0, 0, 0.82)",
        glow: "0 0 38px -8px rgba(92, 214, 255, 0.52)"
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
