// Pure period + status helpers for fixed expenses. No Prisma / no I/O, so the
// same logic drives the list API, the detail-drawer timeline, the ingest linker,
// and the missing-invoice alert job.
//
// The core idea: a fixed expense has an `anchorDate` and a `frequency`; period k
// is `[addPeriods(anchor, k), addPeriods(anchor, k+1))`. Arrival status is always
// COMPUTED from the invoices linked to the expense (never stored), so it resets
// to PENDING on its own when a new period begins.

import { addDays, addMonths, addWeeks, differenceInCalendarDays, differenceInCalendarMonths } from "date-fns"
import type { FixedExpenseFrequency } from "@prisma/client"

export type FixedExpensePeriodStatus = "ARRIVED" | "PENDING" | "OVERDUE"

// Months advanced per period; WEEKLY is handled separately (day-based).
const MONTHS_PER_PERIOD: Record<Exclude<FixedExpenseFrequency, "WEEKLY">, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  YEARLY: 12,
}

/** Advance `date` by `n` whole periods (n may be negative). */
export function addPeriods(date: Date, frequency: FixedExpenseFrequency, n: number): Date {
  if (frequency === "WEEKLY") return addWeeks(date, n)
  return addMonths(date, n * MONTHS_PER_PERIOD[frequency])
}

/** Largest k such that period k has started at or before `target`. */
export function periodIndexFor(frequency: FixedExpenseFrequency, anchor: Date, target: Date): number {
  let k =
    frequency === "WEEKLY"
      ? Math.floor(differenceInCalendarDays(target, anchor) / 7)
      : Math.floor(differenceInCalendarMonths(target, anchor) / MONTHS_PER_PERIOD[frequency])
  // Correct for day-of-month / DST drift the estimate can't capture.
  while (addPeriods(anchor, frequency, k).getTime() > target.getTime()) k--
  while (addPeriods(anchor, frequency, k + 1).getTime() <= target.getTime()) k++
  return k
}

export type PeriodBounds = { index: number; start: Date; end: Date }

/** Bounds of period `index` (`end` is exclusive — it's the next period's start). */
export function periodBounds(
  expense: Pick<FixedExpenseLike, "anchorDate" | "frequency">,
  index: number,
): PeriodBounds {
  return {
    index,
    start: addPeriods(expense.anchorDate, expense.frequency, index),
    end: addPeriods(expense.anchorDate, expense.frequency, index + 1),
  }
}

/** The period that contains `now` (clamped to the first period for future anchors). */
export function currentPeriod(
  expense: Pick<FixedExpenseLike, "anchorDate" | "frequency">,
  now: Date,
): PeriodBounds {
  const index = Math.max(0, periodIndexFor(expense.frequency, expense.anchorDate, now))
  return periodBounds(expense, index)
}

/**
 * Classify a single period: ARRIVED if a linked invoice landed within
 * `[start, end + grace)`, else PENDING while that window is still open, else
 * OVERDUE. Future/not-yet-started periods read as PENDING.
 */
export function classifyPeriod(
  period: PeriodBounds,
  gracePeriodDays: number,
  linkedInvoices: readonly InvoiceMatchLike[],
  now: Date,
): FixedExpensePeriodStatus {
  const startMs = period.start.getTime()
  const graceEndMs = addDays(period.end, gracePeriodDays).getTime()
  const arrived = linkedInvoices.some((inv) => {
    const t = inv.emailDate.getTime()
    return t >= startMs && t < graceEndMs
  })
  if (arrived) return "ARRIVED"
  return now.getTime() < graceEndMs ? "PENDING" : "OVERDUE"
}

/** Headline status for the current period (used by the list + row badge). */
export function expenseStatus(
  expense: FixedExpenseLike,
  linkedInvoices: readonly InvoiceMatchLike[],
  now: Date,
): FixedExpensePeriodStatus {
  return classifyPeriod(currentPeriod(expense, now), expense.gracePeriodDays, linkedInvoices, now)
}

export type TimelineEntry = {
  index: number
  start: Date
  end: Date
  status: FixedExpensePeriodStatus
}

/**
 * The detail-drawer coverage view: one entry per period, newest first, from the
 * current period back toward the expense's creation. Never emits periods before
 * `max(anchorDate, createdAt)`, and caps at `limit` so long-lived expenses don't
 * render hundreds of rows. `offset` pages further back (in periods).
 */
export function periodTimeline(
  expense: FixedExpenseLike,
  linkedInvoices: readonly InvoiceMatchLike[],
  now: Date,
  { limit = 12, offset = 0 }: { limit?: number; offset?: number } = {},
): { entries: TimelineEntry[]; hasMore: boolean } {
  const currentIdx = currentPeriod(expense, now).index
  const startBound = expense.createdAt.getTime() > expense.anchorDate.getTime() ? expense.createdAt : expense.anchorDate
  const firstIdx = Math.max(0, periodIndexFor(expense.frequency, expense.anchorDate, startBound))

  const top = currentIdx - offset
  const from = Math.max(firstIdx, top - limit + 1)
  const entries: TimelineEntry[] = []
  for (let k = top; k >= from; k--) {
    const bounds = periodBounds(expense, k)
    entries.push({
      index: k,
      start: bounds.start,
      end: bounds.end,
      status: classifyPeriod(bounds, expense.gracePeriodDays, linkedInvoices, now),
    })
  }
  return { entries, hasMore: from > firstIdx }
}

/**
 * Does an invoice satisfy a fixed expense? Matches on normalized vendor OR
 * sender email (either is enough); if the expense pins a mailbox, the invoice
 * must also come from it. Used by the ingest linker — see invoice-extract.ts.
 */
export function matchesExpense(
  invoice: Pick<InvoiceMatchLike, "vendorNormalized" | "senderEmail" | "gmailCredentialId">,
  expense: Pick<FixedExpenseLike, "vendorNormalized" | "senderEmail" | "gmailCredentialId">,
): boolean {
  if (expense.gmailCredentialId && invoice.gmailCredentialId !== expense.gmailCredentialId) return false
  const vendorMatch =
    !!expense.vendorNormalized && !!invoice.vendorNormalized && expense.vendorNormalized === invoice.vendorNormalized
  const senderMatch =
    !!expense.senderEmail &&
    !!invoice.senderEmail &&
    expense.senderEmail.toLowerCase() === invoice.senderEmail.toLowerCase()
  return vendorMatch || senderMatch
}

// Structural shapes so both Prisma rows and lighter objects satisfy these — we
// only ever read the fields listed here.
export type FixedExpenseLike = {
  anchorDate: Date
  createdAt: Date
  frequency: FixedExpenseFrequency
  gracePeriodDays: number
  vendorNormalized: string | null
  senderEmail: string | null
  gmailCredentialId: string | null
}

export type InvoiceMatchLike = {
  emailDate: Date
  vendorNormalized: string | null
  senderEmail: string | null
  gmailCredentialId: string | null
}
