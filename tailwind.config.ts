import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

// ─── Raw palette ───────────────────────────────────────────────────────────
// Change values here — they propagate everywhere automatically.

const palette = {
  // Brand
  blue:   "#7AA7FF",
  purple: "#A78BFA",
  teal:   "#22D3EE",
  cyan:   "#88D0FF",

  // Status
  success: "#34D399",
  warning: "#FBBF24",
  danger:  "#FB7171",
  info:    "#60A5FA",

  // Status backgrounds
  successBg: "#ECFDF5",
  warningBg: "#FFFBEB",
  dangerBg:  "#FEF2F2",
  infoBg:    "#EFF6FF",
  purpleBg:  "#F5F3FF",

  // Surfaces
  background: "#FAFBFF",
  surface:    "#FFFFFF",
  hover:      "#F1F3F8",
  border:     "#E8EDFA",

  // Text
  heading:   "#1E293B",
  bodyDark:  "#334155",
  bodyMid:   "#64748B",
  muted:     "#94A3B8",
  subtle:    "#475569",
  faint:     "#CBD5E1",
} as const

// ─── Tailwind config ───────────────────────────────────────────────────────

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
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },

      colors: {
        // ── Surfaces ──────────────────────────────────────────────
        background: palette.background,
        surface:    palette.surface,
        hover:      palette.hover,
        border:     palette.border,

        // ── Brand ─────────────────────────────────────────────────
        primary: palette.blue,
        purple:  palette.purple,
        teal:    palette.teal,

        // ── Status ────────────────────────────────────────────────
        success: palette.success,
        warning: palette.warning,
        danger:  palette.danger,
        info:    palette.info,

        // ── Status backgrounds ────────────────────────────────────
        "success-bg": palette.successBg,
        "warning-bg": palette.warningBg,
        "danger-bg":  palette.dangerBg,
        "info-bg":    palette.infoBg,
        "purple-bg":  palette.purpleBg,

        // ── Text ──────────────────────────────────────────────────
        heading:          palette.heading,
        "text-primary":   palette.bodyDark,
        "text-secondary": palette.bodyMid,
        dim:              palette.muted,
        subtle:           palette.subtle,
        faint:            palette.faint,

        // ── shadcn tokens (mapped from palette, do not change keys) ─
        foreground:             palette.bodyDark,
        card:                   palette.surface,
        "card-foreground":      palette.bodyDark,
        popover:                palette.surface,
        "popover-foreground":   palette.bodyDark,
        "primary-foreground":   palette.surface,
        secondary:              palette.hover,
        "secondary-foreground": palette.bodyDark,
        muted:                  palette.hover,
        "muted-foreground":     palette.bodyMid,
        accent:                 palette.hover,
        "accent-foreground":    palette.bodyDark,
        destructive:            palette.danger,
        input:                  palette.border,
        ring:                   palette.blue,
      },

      borderRadius: {
        DEFAULT: "10px",
        sm:      "6px",
        lg:      "14px",
        full:    "9999px",
      },

      boxShadow: {
        primary: "0 6px 16px rgba(122,167,255,.35)",
        card:    "0 12px 40px rgba(80,110,180,.10)",
        logo:    "0 6px 18px rgba(122,167,255,.4)",
      },

      backgroundImage: {
        "gradient-sky":      `linear-gradient(135deg, ${palette.blue}, ${palette.cyan})`,
        "gradient-lavender": `linear-gradient(135deg, ${palette.purple}, #DCCAFF)`,
        "gradient-mint":     `linear-gradient(135deg, ${palette.success}, #A7F3D0)`,
        "gradient-auth":     `linear-gradient(150deg, ${palette.blue} 0%, ${palette.purple} 60%, ${palette.cyan} 100%)`,
        "gradient-logo":     `linear-gradient(135deg, ${palette.blue}, ${palette.purple})`,
      },
    },
  },
  plugins: [animate],
}

export default config
