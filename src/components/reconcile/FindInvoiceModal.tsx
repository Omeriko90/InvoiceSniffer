// Client component by import — only ever rendered from ReconcileClient
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Lightbulb, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { queries } from "@/queries"
import { useTransactionAction } from "@/hooks/useTransactionAction"
import { normalizeMerchant } from "@/lib/matching"
import type { TransactionRow } from "@/components/reconcile/ReconcileClient"

import { fmtMoney } from "@/lib/money"

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

function CandidateList({ transaction, search, onLinked }: {
  transaction: TransactionRow
  search: string
  onLinked: () => void
}) {
  const action = useTransactionAction()
  const q = useDebounced(search, 250)
  const candidates = useQuery(queries.reconcile.candidates(transaction.id, q))

  return (
    <div className="flex flex-col gap-[8px] max-h-[320px] overflow-y-auto">
      {candidates.isLoading && (
        <p className="text-[13px] text-[#94A3B8] py-6 text-center">Searching…</p>
      )}
      {candidates.data?.length === 0 && (
        <p className="text-[13px] text-[#94A3B8] py-6 text-center">
          No invoices match — try a different search.
        </p>
      )}
      {candidates.data?.map((c) => {
        const pct = c.confidence !== null ? Math.round(c.confidence * 100) : null
        return (
          <div
            key={c.invoiceId}
            className="flex items-center gap-[12px] border border-[#E8EDFA] rounded-[11px] px-[13px] py-[11px]"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-[600] text-[#334155] truncate">
                {c.vendorName ?? "Unknown vendor"}
                {c.invoiceNumber && (
                  <span className="text-[#94A3B8] font-mono font-[500]"> — {c.invoiceNumber}</span>
                )}
              </p>
              <p className="text-[11.5px] text-[#94A3B8] truncate">
                {fmtMoney(c.amount, c.currency)} · {format(new Date(c.date), "MMM d")} · {c.reason}
              </p>
            </div>
            {pct !== null && (
              <div className="flex items-center gap-[6px] w-[86px] shrink-0">
                <div className="flex-1 h-[5px] bg-[#F1F3F8] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 85 ? "#34D399" : pct >= 55 ? "#FBBF24" : "#FB7171",
                    }}
                  />
                </div>
                <span className="text-[11px] font-[600] text-[#94A3B8]">{pct}%</span>
              </div>
            )}
            <button
              disabled={action.isPending}
              onClick={() =>
                action.mutate(
                  { id: transaction.id, action: "link", invoiceId: c.invoiceId },
                  { onSuccess: onLinked }
                )
              }
              className="text-[12px] font-[600] px-[13px] py-[6px] rounded-[8px] whitespace-nowrap cursor-pointer border border-[#7AA7FF] bg-[#7AA7FF] text-white transition-[filter] hover:brightness-[1.04] disabled:opacity-50"
            >
              Link
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function FindInvoiceModal({ transaction, onClose }: {
  transaction: TransactionRow | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!transaction} onOpenChange={(open) => { if (!open) onClose() }}>
      {transaction && (
        <ModalBody key={transaction.id} transaction={transaction} onClose={onClose} />
      )}
    </Dialog>
  )
}

function ModalBody({ transaction, onClose }: {
  transaction: TransactionRow
  onClose: () => void
}) {
  // Pre-filled with the cleaned-up merchant guess; remounted per transaction
  const [search, setSearch] = useState(() => normalizeMerchant(transaction.merchant))

  return (
    <DialogContent className="sm:max-w-[540px] p-0 gap-0 bg-white border-[#E8EDFA] rounded-[16px]">
          <DialogHeader className="px-[22px] pt-[20px] pb-[14px] border-b border-[#F1F3F8]">
            <DialogTitle className="text-[16px] font-[700] text-heading">
              Find invoice
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-[#64748B]">
              Matching{" "}
              <span className="font-mono font-[600] text-[#334155]">{transaction.merchant}</span>
              {" · "}{fmtMoney(transaction.amount, transaction.currency)}
              {" · "}{format(new Date(transaction.date), "MMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="p-[22px] flex flex-col gap-[14px]">
            <div className="relative">
              <Search size={14} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor or invoice #…"
                className="h-auto pl-[34px] pr-3 py-[9px] text-[13.5px] text-text-primary border-[#E8EDFA] rounded-[10px] bg-background"
              />
            </div>

            <p className="text-[11px] font-[700] text-[#64748B] uppercase tracking-[0.05em]">
              Suggested matches
            </p>

            <CandidateList transaction={transaction} search={search} onLinked={onClose} />

            <div className="flex items-center gap-[7px] text-[11.5px] text-[#94A3B8] border-t border-[#F1F3F8] pt-[13px]">
              <Lightbulb size={13} strokeWidth={1.5} className="shrink-0" />
              <span>Linking teaches a vendor alias, so future charges from this merchant match automatically.</span>
            </div>
          </div>
    </DialogContent>
  )
}
