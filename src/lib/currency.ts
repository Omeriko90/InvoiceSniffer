// Single source of truth for currency handling. Invoices and bank CSVs carry
// currency written many ways — a symbol ("₪"), a local alias ("NIS"), a Hebrew
// spelling ('ש"ח', "שקל"), or an ISO 4217 code ("ILS"). Before this module those
// mappings lived in three disconnected places (csv-import, matching, invoice-
// detection), so the same real currency landed under several strings and the
// reconcile currency gate rejected valid matches. Everything normalizes here now.

// Symbol / alias / local spelling → ISO 4217 code. Keys are matched first
// verbatim (so non-Latin spellings survive) and then upper-cased.
export const CURRENCY_ALIASES: Record<string, string> = {
  // ILS — symbol, Hebrew spellings (straight + gershayim quote), aliases
  "₪": "ILS",
  'ש"ח': "ILS",
  "ש״ח": "ILS", // Hebrew gershayim U+05F4
  שקל: "ILS",
  שקלים: "ILS",
  שח: "ILS",
  NIS: "ILS",
  // USD
  "$": "USD",
  US$: "USD",
  דולר: "USD",
  // EUR
  "€": "EUR",
  יורו: "EUR",
  אירו: "EUR",
  // GBP
  "£": "GBP",
  // JPY
  "¥": "JPY",
  // Other common ISO currencies with distinct symbols
  CA$: "CAD",
  C$: "CAD",
  A$: "AUD",
  "₹": "INR",
}

// ISO 4217 code → display symbol, for compact rendering.
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  ILS: "₪",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
  CHF: "CHF",
  INR: "₹",
}

// Currencies offered as the org-wide display currency (settings dropdown).
export const SUPPORTED_DISPLAY_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "ILS",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
] as const

export type DisplayCurrency = (typeof SUPPORTED_DISPLAY_CURRENCIES)[number]

export function isSupportedDisplayCurrency(value: unknown): value is DisplayCurrency {
  return (
    typeof value === "string" &&
    (SUPPORTED_DISPLAY_CURRENCIES as readonly string[]).includes(value)
  )
}

// Normalize a single currency token (a CSV cell or an extracted value) to an ISO
// code. Matches the raw trimmed value first so non-Latin spellings resolve, then
// the upper-cased form; unknown codes pass through upper-cased (e.g. "sek" → "SEK").
export function normalizeCurrencyCode(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  const upper = trimmed.toUpperCase()
  return CURRENCY_ALIASES[trimmed] ?? CURRENCY_ALIASES[upper] ?? upper
}
