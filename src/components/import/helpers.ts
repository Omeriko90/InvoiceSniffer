import { normalizeAmount } from "@/lib/csv-import"

export function formatAmount(raw: string | undefined) {
  const n = normalizeAmount(raw ?? "")
  if (n === null) return "—"
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
}
