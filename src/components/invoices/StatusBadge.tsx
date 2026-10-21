// Client component by import — only ever rendered from <InvoicesClient>.
import { StatusPill } from "@/components/ui/status-pill"
import { useT } from "@/components/i18n/LocaleProvider"
import type { InvoiceStatus, StatusMeta } from "./types"

// Maps an invoice status to its i18n label key. Keys mirror STATUS_META in
// constants.ts, which we intentionally don't edit.
const STATUS_LABEL_KEYS: Record<string, string> = {
  MATCHED: "invoices.status.matched",
  UNMATCHED: "invoices.status.unmatched",
  DETECTED: "invoices.status.detected",
  REVIEWED: "invoices.status.reviewed",
  IGNORED: "invoices.status.ignored",
}

export function StatusBadge({ status, statusKey }: { status: StatusMeta; statusKey: InvoiceStatus }) {
  const t = useT()
  const key = STATUS_LABEL_KEYS[statusKey]
  return (
    <StatusPill>
      {key ? t(key as never) : status.label}
    </StatusPill>
  )
}
