// Client component by import — only ever rendered from <ReconcileClient>.
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useT } from "@/components/i18n/LocaleProvider"
import type { TransactionRow } from "@/components/reconcile/types"

// Invoice label resolved here via i18n rather than editing the sibling helpers.ts.
function useInvoiceLabel(txn: TransactionRow): { text: string; muted: boolean } {
  const t = useT()
  if (txn.invoice) {
    const vendor = txn.invoice.vendorName ?? t("reconcile.unknownVendor")
    return {
      text: txn.invoice.invoiceNumber ? `${vendor} — ${txn.invoice.invoiceNumber}` : vendor,
      muted: false,
    }
  }
  if (txn.status === "NO_INVOICE") return { text: t("reconcile.invoiceLabel.notRequired"), muted: true }
  return { text: t("reconcile.invoiceLabel.notFound"), muted: true }
}

export function MatchedInvoiceCell({ txn }: { txn: TransactionRow }) {
  const inv = useInvoiceLabel(txn)

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={cn(
            "text-sm font-semibold truncate",
            inv.muted ? "text-dim" : "text-foreground",
          )}
        >
          {inv.text}
        </span>
        {txn.aiSuggested && (
          <span
            className="inline-flex items-center gap-[3px] rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary shrink-0"
            title="Suggested by AI — please review"
          >
            <Sparkles size={10} aria-hidden />
            AI
          </span>
        )}
      </div>
      {txn.matchReason && (
        <div className="text-xs text-dim truncate">{txn.matchReason}</div>
      )}
    </div>
  )
}
