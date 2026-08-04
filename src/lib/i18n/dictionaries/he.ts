import type { Dictionary } from "./en"

// Hebrew dictionary. Typed as `satisfies Dictionary` so the compiler enforces
// full key parity with `en.ts`.
export const he = {
  common: {
    save: "שמור",
    cancel: "ביטול",
  },
  settings: {
    language: {
      title: "שפה",
      description: "בחר את שפת הממשק.",
      saved: "השפה עודכנה",
    },
  },
} satisfies Dictionary
