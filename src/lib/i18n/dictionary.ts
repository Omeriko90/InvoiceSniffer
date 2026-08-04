import { en, type Dictionary } from "./dictionaries/en"
import { he } from "./dictionaries/he"
import type { Locale } from "./config"

export type { Dictionary }

export const dictionaries: Record<Locale, Dictionary> = { en, he }
