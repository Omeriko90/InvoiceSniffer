// Pure period + status helpers for fixed expenses. No Prisma / no I/O, so the
// same logic drives the list API, the detail-drawer timeline, the ingest linker,
// and the missing-invoice alert job.
//
// The core idea: a fixed expense has an `anchorDate` and a `frequency`; period k
// is `[addPeriods(anchor, k), addPeriods(anchor, k+1))`. Arrival status is always
// COMPUTED from the invoices linked to the expense (never stored), so it resets
// to PENDING on its own when a new period begins.

import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns"
import type { FixedExpenseFrequency, Prisma } from "@prisma/client"

export type FixedExpensePeriodStatus = "ARRIVED" | "PENDING" | "OVERDUE"

// Week-based cadences advance in whole weeks; the rest advance in whole months.
type WeekBasedFrequency = Extract<FixedExpenseFrequency, "WEEKLY" | "BIWEEKLY">
const WEEKS_PER_PERIOD: Record<WeekBasedFrequency, number> = {
  WEEKLY: 1,
  BIWEEKLY: 2,
}
const MONTHS_PER_PERIOD: Record<Exclude<FixedExpenseFrequency, WeekBasedFrequency>, number> = {
  MONTHLY: 1,
  BIMONTHLY: 2,
  QUARTERLY: 3,
  YEARLY: 12,
}

function isWeekBased(frequency: FixedExpenseFrequency): frequency is WeekBasedFrequency {
  return frequency === "WEEKLY" || frequency === "BIWEEKLY"
}

/**
 * The date period boundaries actually roll forward from. Every cadence snaps to
 * the natural calendar boundary containing the anchor — start of week / month /
 * quarter / year — so periods line up with how people read them. The raw
 * anchorDate defaults to the day the expense was created (see
 * FixedExpenseFormDialog); without snapping, an expense created on Aug 6 would
 * run its monthly periods 6th→6th and drop an invoice that arrived Aug 1 into
 * the *previous* period. `weekStartsOn` defaults to Sunday, matching the app's
 * primary (Israel) locale.
 */
export function effectiveAnchor(
  expense: Pick<FixedExpenseLike, "anchorDate" | "frequency">,
): Date {
  switch (expense.frequency) {
    case "WEEKLY":
    case "BIWEEKLY":
      return startOfWeek(expense.anchorDate)
    case "MONTHLY":
    case "BIMONTHLY":
      return startOfMonth(expense.anchorDate)
    case "QUARTERLY":
      return startOfQuarter(expense.anchorDate)
    case "YEARLY":
      return startOfYear(expense.anchorDate)
  }
}

/** Advance `date` by `n` whole periods (n may be negative). */
export function addPeriods(date: Date, frequency: FixedExpenseFrequency, n: number): Date {
  return isWeekBased(frequency)
    ? addWeeks(date, n * WEEKS_PER_PERIOD[frequency])
    : addMonths(date, n * MONTHS_PER_PERIOD[frequency])
}

/** Largest k such that period k has started at or before `target`. */
export function periodIndexFor(frequency: FixedExpenseFrequency, anchor: Date, target: Date): number {
  let k = isWeekBased(frequency)
    ? Math.floor(differenceInCalendarDays(target, anchor) / (7 * WEEKS_PER_PERIOD[frequency]))
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
  const anchor = effectiveAnchor(expense)
  return {
    index,
    start: addPeriods(anchor, expense.frequency, index),
    end: addPeriods(anchor, expense.frequency, index + 1),
  }
}

/** The period that contains `now` (clamped to the first period for future anchors). */
export function currentPeriod(
  expense: Pick<FixedExpenseLike, "anchorDate" | "frequency">,
  now: Date,
): PeriodBounds {
  const index = Math.max(0, periodIndexFor(expense.frequency, effectiveAnchor(expense), now))
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
  const anchor = effectiveAnchor(expense)
  const startBound = expense.createdAt.getTime() > anchor.getTime() ? expense.createdAt : anchor
  const firstIdx = Math.max(0, periodIndexFor(expense.frequency, anchor, startBound))

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
 * sender email (either is enough) — EXCEPT a sender hit is ignored when the
 * invoice's own known vendor contradicts the expense's vendors (shared invoicing
 * senders like iCount). If the expense pins a mailbox, the invoice must also come
 * from it. Used by the ingest linker — see invoice-extract.ts. The SQL twin of
 * this predicate is buildFixedExpenseMatchWhere below (used by the backfills).
 */
// Case-insensitive dedup that keeps each value's first-seen spelling. Used to
// keep a fixed expense's vendor-title / sender-email arrays free of duplicates
// (e.g. "Billing@X.com" and "billing@x.com" collapse to one) on create, update,
// and absorb. Blank entries are dropped.
export function dedupeInsensitive(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    const key = v.toLowerCase()
    if (v && !seen.has(key)) {
      seen.add(key)
      out.push(v)
    }
  }
  return out
}

export function matchesExpense(
  invoice: Pick<InvoiceMatchLike, "vendorNormalized" | "senderEmail" | "gmailCredentialId">,
  expense: Pick<FixedExpenseLike, "vendorNormalized" | "senderEmail" | "gmailCredentialId">,
): boolean {
  if (expense.gmailCredentialId && invoice.gmailCredentialId !== expense.gmailCredentialId) return false
  const vendorMatch =
    !!invoice.vendorNormalized && expense.vendorNormalized.includes(invoice.vendorNormalized)
  const sender = invoice.senderEmail?.toLowerCase()
  const senderMatch = !!sender && expense.senderEmail.some((e) => e.toLowerCase() === sender)
  // Shared invoicing senders (iCount, Stripe, …) deliver many vendors' invoices
  // from one address, so a sender hit alone must not absorb an invoice whose OWN
  // identified vendor contradicts the expense's known vendors. Only guard when we
  // have both sides to compare — a sender-only expense (no vendorNormalized) or an
  // invoice with no extracted vendor still falls back to sender matching.
  const vendorConflict =
    !!invoice.vendorNormalized && expense.vendorNormalized.length > 0 && !vendorMatch
  if (vendorConflict) return false
  return vendorMatch || senderMatch
}

// SQL twin of matchesExpense() for the backfill/absorb sweeps (create route and
// absorb-invoice route). Returns the invoice-match constraint the caller spreads
// into its updateMany `where` (alongside org / fixedExpenseId / mailbox filters),
// or null when the expense carries no match signal at all. `Prisma` is a type-only
// import, so this stays runtime-pure like the rest of the module. Keep in lockstep
// with matchesExpense: a sender hit must NOT absorb an invoice whose own known
// vendor contradicts the expense's vendors (shared invoicing senders like iCount).
export function buildFixedExpenseMatchWhere(signals: {
  vendorNormalized: string[]
  senderEmail: string[]
}): Prisma.InvoiceWhereInput | null {
  const vendors = signals.vendorNormalized
  // One condition per address — `in` can't carry a case-insensitive mode, and
  // stored senders are lowercased while invoice casing isn't guaranteed.
  const senderConds: Prisma.InvoiceWhereInput[] = signals.senderEmail.map((e) => ({
    senderEmail: { equals: e, mode: "insensitive" },
  }))

  // Sender-only expense: nothing to contradict, so match on sender alone.
  if (vendors.length === 0) return senderConds.length > 0 ? { OR: senderConds } : null

  const vendorCond: Prisma.InvoiceWhereInput = { vendorNormalized: { in: vendors } }
  if (senderConds.length === 0) return vendorCond

  // Vendor match, OR a sender match narrowed so an invoice with a KNOWN vendor
  // outside the expense's list is excluded (a blank/null vendor is still allowed).
  return {
    OR: [
      vendorCond,
      {
        AND: [
          { OR: senderConds },
          { OR: [{ vendorNormalized: null }, { vendorNormalized: "" }, vendorCond] },
        ],
      },
    ],
  }
}

// Structural shapes so both Prisma rows and lighter objects satisfy these — we
// only ever read the fields listed here.
export type FixedExpenseLike = {
  anchorDate: Date
  createdAt: Date
  frequency: FixedExpenseFrequency
  gracePeriodDays: number
  vendorNormalized: string[]
  senderEmail: string[]
  gmailCredentialId: string | null
}

export type InvoiceMatchLike = {
  emailDate: Date
  vendorNormalized: string | null
  senderEmail: string | null
  gmailCredentialId: string | null
}
