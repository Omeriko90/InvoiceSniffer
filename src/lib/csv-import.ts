import { parse } from "csv-parse/browser/esm/sync"
import { parse as parseDate, isValid } from "date-fns"
import type { ColumnMapping, ImportRow } from "@/api-types/import"

export interface ParsedCsv {
  fileName: string
  headers: string[]
  records: Record<string, string>[]
}

export type DraftMapping = {
  date: string | null
  merchant: string | null
  amount: string | null
  currency: string | null
}

export const EMPTY_MAPPING: DraftMapping = { date: null, merchant: null, amount: null, currency: null }

export function parseCsvText(fileName: string, text: string): ParsedCsv {
  let headers: string[] = []
  const records: Record<string, string>[] = parse(text, {
    columns: (row: string[]) => {
      headers = row.map((h) => h.trim())
      return headers
    },
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  })
  return { fileName, headers, records }
}

export function headersKeyOf(headers: string[]): string {
  return headers.map((h) => h.toLowerCase().trim()).join("|")
}

/** "amex_may2026.csv" → "Amex" */
export function labelFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "")
  const token = base.split(/[_\-\s.]/).find((t) => /[a-zA-Z]/.test(t)) ?? base
  const word = token.replace(/[^a-zA-Z]/g, "")
  return word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : "CSV"
}

const FIELD_PATTERNS: Record<keyof DraftMapping, RegExp> = {
  date: /date|posted|time/i,
  merchant: /merchant|description|payee|narrative|details|name/i,
  amount: /amount|debit|charge|value|total/i,
  currency: /currency|curr\b|iso/i,
}

export function autoDetectMapping(headers: string[]): DraftMapping {
  const used = new Set<string>()
  const pick = (pattern: RegExp) => {
    const hit = headers.find((h) => pattern.test(h) && !used.has(h)) ?? null
    if (hit) used.add(hit)
    return hit
  }
  return {
    date: pick(FIELD_PATTERNS.date),
    merchant: pick(FIELD_PATTERNS.merchant),
    amount: pick(FIELD_PATTERNS.amount),
    currency: pick(FIELD_PATTERNS.currency),
  }
}

const DATE_FORMATS = [
  "yyyy-MM-dd", "MM/dd/yyyy", "M/d/yyyy", "dd/MM/yyyy", "yyyy/MM/dd", "dd.MM.yyyy", "MMM d, yyyy",
  // Two-digit years last — "dd/MM/yyyy" happily parses "11/05/26" as year 0026,
  // so the plausibleYear guard below rejects it and lets "dd/MM/yy" map 26 → 2026
  "dd/MM/yy", "MM/dd/yy", "dd.MM.yy",
]

const plausibleYear = (d: Date) => d.getFullYear() >= 1971

export function normalizeDate(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  for (const fmt of DATE_FORMATS) {
    const d = parseDate(v, fmt, new Date())
    if (isValid(d) && plausibleYear(d)) return d.toISOString()
  }
  const fallback = new Date(v)
  return Number.isNaN(fallback.getTime()) || !plausibleYear(fallback) ? null : fallback.toISOString()
}

export function normalizeAmount(value: string): number | null {
  let v = value.trim()
  if (!v) return null
  const negative = /^\(.*\)$/.test(v) || v.startsWith("-")
  v = v.replace(/[^0-9.,]/g, "")
  if (!v) return null
  // Decide decimal separator: the right-most of "." / "," wins
  const lastDot = v.lastIndexOf(".")
  const lastComma = v.lastIndexOf(",")
  if (lastComma > lastDot) {
    v = v.replace(/\./g, "").replace(",", ".")
  } else {
    v = v.replace(/,/g, "")
  }
  const n = Number(v)
  if (Number.isNaN(n)) return null
  return negative ? -n : n
}

// Bank CSVs often carry a symbol ("₪") or local alias ("NIS") instead of an ISO code
const CURRENCY_ALIASES: Record<string, string> = {
  "₪": "ILS", NIS: "ILS", "$": "USD", US$: "USD", "€": "EUR", "£": "GBP", "¥": "JPY",
}

export function normalizeCurrencyCode(value: string): string {
  const v = value.trim().toUpperCase()
  return CURRENCY_ALIASES[v] ?? v
}

export function buildImportRows(
  records: Record<string, string>[],
  mapping: ColumnMapping
): { rows: ImportRow[]; skipped: number } {
  const rows: ImportRow[] = []
  let skipped = 0
  for (const record of records) {
    const date = normalizeDate(record[mapping.date] ?? "")
    const merchant = (record[mapping.merchant] ?? "").trim()
    const amount = normalizeAmount(record[mapping.amount] ?? "")
    if (!date || !merchant || amount === null) {
      skipped++
      continue
    }
    const currency = mapping.currency
      ? normalizeCurrencyCode((record[mapping.currency] ?? "").trim())
      : ""
    rows.push({ date, merchant, amount, ...(currency ? { currency } : {}) })
  }
  return { rows, skipped }
}
