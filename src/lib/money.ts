import { normalizeCurrencyCode } from "@/lib/currency"

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

// An invoice-like value carrying both its original amount/currency and the
// amount converted to the org display currency (locked at arrival). Older or
// unconverted invoices have null converted fields and fall back to the original.
export type Convertible = {
  totalAmount: string | number
  currency: string
  displayAmount?: string | number | null
  displayCurrency?: string | null
}

// The amount to present: the display-currency conversion when available, else
// the original. Use this everywhere amounts are shown so cross-currency figures
// (tables, dashboard totals) are comparable.
export function displayAmount(o: Convertible): { amount: string | number; currency: string } {
  if (o.displayAmount != null && o.displayCurrency) {
    return { amount: o.displayAmount, currency: o.displayCurrency }
  }
  return { amount: o.totalAmount, currency: o.currency }
}

export function fmtDisplayMoney(o: Convertible): string {
  const d = displayAmount(o)
  return fmtMoney(d.amount, d.currency)
}

// True when the original currency differs from the display currency, i.e. there
// is a meaningful second (original) amount worth showing alongside the converted.
export function hasDistinctOriginal(o: Convertible): boolean {
  return (
    o.displayCurrency != null &&
    normalizeCurrencyCode(o.displayCurrency) !== normalizeCurrencyCode(o.currency)
  )
}

// Same as fmtMoney but rounded to whole units — for summary/dashboard figures
// where cents are noise.
export function fmtMoneyWhole(amount: number | string, currency: string): string {
  const code = normalizeCurrencyCode(currency)
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(Number(amount))
  } catch {
    return `${Number(amount).toFixed(0)} ${currency}`
  }
}
