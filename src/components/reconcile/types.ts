import type { MatchRow } from "@/api-types/reconcile"

// The reconcile table renders ephemeral session rows (MatchRow), not persisted
// transactions. Aliased so the presentational components read the same shape.
export type TransactionRow = MatchRow

export type TabId = "all" | "matched" | "possible" | "missing" | "none" | "collisions" | "invoices"

export type RunAction = "confirm" | "reject" | "no_invoice" | "undo"
