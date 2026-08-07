// Single source of truth for fixed-expense frequency + status vocab and the
// arrival-status badge styling. Shared by the Zod validation in the API routes
// and every UI surface (form select, row badge, detail drawer) so the labels and
// the Prisma enums (schema.prisma) never drift. Mirrors the invoice-categories.ts
// pattern.

import type { FixedExpensePeriodStatus } from "./fixed-expenses"

export const FIXED_EXPENSE_FREQUENCIES = [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "BIMONTHLY",
  "QUARTERLY",
  "YEARLY",
] as const
export type FixedExpenseFrequency = (typeof FIXED_EXPENSE_FREQUENCIES)[number]

export const FREQUENCY_LABELS: Record<FixedExpenseFrequency, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  BIMONTHLY: "Bi-monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
}

// Singular noun for a single occurrence, used in copy like "no invoice this month".
export const FREQUENCY_PERIOD_NOUN: Record<FixedExpenseFrequency, string> = {
  WEEKLY: "week",
  BIWEEKLY: "two weeks",
  MONTHLY: "month",
  BIMONTHLY: "two months",
  QUARTERLY: "quarter",
  YEARLY: "year",
}

export const FIXED_EXPENSE_STATUSES = ["ACTIVE", "PAUSED"] as const
export type FixedExpenseStatus = (typeof FIXED_EXPENSE_STATUSES)[number]

// Arrival-status badge styling — pastel bg + saturated fg, matching the
// STATUS_META pattern in src/components/invoices/constants.ts. In the detail
// drawer's per-period timeline, OVERDUE reads as "Missing"; as the row headline
// it reads as "Overdue" (see label maps below).
export const PERIOD_STATUS_META: Record<FixedExpensePeriodStatus, { bg: string; color: string }> = {
  ARRIVED: { bg: "#ECFDF5", color: "#059669" },
  PENDING: { bg: "#EFF6FF", color: "#2563EB" },
  OVERDUE: { bg: "#FEF2F2", color: "#DC2626" },
}

// Headline label (list row / drawer header).
export const PERIOD_STATUS_LABELS: Record<FixedExpensePeriodStatus, string> = {
  ARRIVED: "Arrived",
  PENDING: "Pending",
  OVERDUE: "Overdue",
}

// Per-period label (timeline rows) — a past period with nothing reads as "Missing".
export const TIMELINE_STATUS_LABELS: Record<FixedExpensePeriodStatus, string> = {
  ARRIVED: "Arrived",
  PENDING: "Pending",
  OVERDUE: "Missing",
}
