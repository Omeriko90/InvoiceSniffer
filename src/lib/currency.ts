export const CURRENCY_ALIASES: Record<string, string> = {
  "₪": "ILS",
  'ש"ח': "ILS",
  "ש״ח": "ILS",
  שקל: "ILS",
  שקלים: "ILS",
  שח: "ILS",
  NIS: "ILS",
  "$": "USD",
  US$: "USD",
  דולר: "USD",
  "€": "EUR",
  יורו: "EUR",
  אירו: "EUR",
  "£": "GBP",
  "¥": "JPY",
  CA$: "CAD",
  C$: "CAD",
  A$: "AUD",
  "₹": "INR",
}

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

export function normalizeCurrencyCode(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  const upper = trimmed.toUpperCase()
  return CURRENCY_ALIASES[trimmed] ?? CURRENCY_ALIASES[upper] ?? upper
}
