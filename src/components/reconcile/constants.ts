import type { TxnStatus } from "@/components/reconcile/status"
import type { TabId } from "@/components/reconcile/types"

export const GRID = { gridTemplateColumns: ".7fr 1.5fr .8fr 1.7fr 1fr 1.6fr", gap: "14px" }

export const TAB_FOR_STATUS = {
  MATCHED: "matched",
  POSSIBLE: "possible",
  UNMATCHED: "missing",
  NO_INVOICE: "none",
} as const satisfies Record<TxnStatus, TabId>
