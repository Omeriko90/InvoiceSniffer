// Foreign-exchange rates for the display-currency feature. Uses Frankfurter
// (https://frankfurter.dev), a free, key-less ECB-backed API. Rates are daily,
// which is all invoice display needs. Fail-open: any error returns null and the
// caller keeps the original amount rather than blocking ingest on a flaky API.
//
// Rates are locked at invoice arrival (we call getRate once and persist the
// result), so this only ever fetches "latest".

// Cache one day's rates in-process, keyed by from:to:YYYY-MM-DD, so a batch of
// invoices arriving together shares a single network call.
const cache = new Map<string, number | null>()

export async function getRate(from: string, to: string): Promise<number | null> {
  const f = from.trim().toUpperCase()
  const t = to.trim().toUpperCase()
  if (!f || !t) return null
  if (f === t) return 1

  const day = new Date().toISOString().slice(0, 10)
  const key = `${f}:${t}:${day}`
  if (cache.has(key)) return cache.get(key) ?? null

  let rate: number | null = null
  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${f}&to=${t}`)
    if (res.ok) {
      const data = (await res.json()) as { rates?: Record<string, number> }
      const value = data?.rates?.[t]
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        rate = value
      }
    }
  } catch {
    rate = null
  }
  cache.set(key, rate)
  return rate
}

// Convert an amount, rounded to 2 decimals. Returns null when no rate is known.
export function convertAmount(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100
}

export type Conversion = {
  displayAmount: number
  displayCurrency: string
  fxRate: number
  fxAsOf: Date
}

// Convert an amount into the display currency, capturing the rate and date so it
// can be locked onto the invoice at arrival. Returns null (caller falls back to
// the original amount) when no rate is available. When from === to the rate is 1,
// so displayAmount === amount and callers can always read the converted fields.
export async function convertForDisplay(
  amount: number,
  from: string,
  to: string
): Promise<Conversion | null> {
  const rate = await getRate(from, to)
  if (rate === null) return null
  return {
    displayAmount: convertAmount(amount, rate),
    displayCurrency: to.trim().toUpperCase(),
    fxRate: rate,
    fxAsOf: new Date(),
  }
}
