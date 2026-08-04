// English dictionary — the source of truth for translation keys.
// `he.ts` is typed against this object, so any key added here MUST also be added
// there (a missing Hebrew translation becomes a compile error).
//
// Group keys by namespace. Values may contain {name}-style placeholders, and a
// key may be an object with `_one` / `_other` variants for pluralization.
export const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
  },
  settings: {
    language: {
      title: "Language",
      description: "Choose the language for the interface.",
    },
  },
}

export type Dictionary = typeof en
