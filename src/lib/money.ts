import { normalizeCurrencyCode } from "@/lib/csv-import"

// CSV imports can carry symbol "currencies" ("₪") that Intl rejects —
// normalize to ISO first and fall back to a plain prefix if still unknown.
export function fmtMoney(amount: number | string, currency: string): string {
  const code = normalizeCurrencyCode(currency)
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(Number(amount))
  } catch {
    return `${currency}${Number(amount).toFixed(2)}`
  }
}
