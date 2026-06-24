import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config: Config = {
  darkMode: ["class", "[data-theme='dark']"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },

      colors: {
        background: "#FAFBFF",
        surface:    "#FFFFFF",
        hover:      "#F1F3F8",
        border:     "#E8EDFA",

        primary: "#7AA7FF",
        purple:  "#A78BFA",
        teal:    "#22D3EE",

        success: "#34D399",
        warning: "#FBBF24",
        danger:  "#FB7171",
        info:    "#60A5FA",

        "success-bg": "#ECFDF5",
        "warning-bg": "#FFFBEB",
        "danger-bg":  "#FEF2F2",
        "info-bg":    "#EFF6FF",
        "purple-bg":  "#F5F3FF",

        "text-primary":   "#334155",
        "text-secondary": "#64748B",
      },

      fontSize: {
        h1:      ["32px", { lineHeight: "40px", fontWeight: "700", letterSpacing: "-0.02em" }],
        h2:      ["24px", { lineHeight: "32px", fontWeight: "600", letterSpacing: "-0.01em" }],
        h3:      ["20px", { lineHeight: "28px", fontWeight: "600", letterSpacing: "0" }],
        body:    ["16px", { lineHeight: "24px", fontWeight: "400" }],
        small:   ["14px", { lineHeight: "20px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "500", letterSpacing: "0.02em" }],
      },

      borderRadius: {
        DEFAULT: "10px",
        sm:      "6px",
        lg:      "14px",
        full:    "9999px",
      },

      backgroundImage: {
        "gradient-sky":      "linear-gradient(135deg, #7AA7FF, #88D0FF)",
        "gradient-lavender": "linear-gradient(135deg, #A78BFA, #DCCAFF)",
        "gradient-mint":     "linear-gradient(135deg, #34D399, #A7F3D0)",
      },
    },
  },
  plugins: [animate],
}

export default config
