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

export function convertAmount(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100
}

export type Conversion = {
  displayAmount: number
  displayCurrency: string
  fxRate: number
  fxAsOf: Date
}

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
