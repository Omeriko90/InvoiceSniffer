// Client component by import — only ever rendered from <FindInvoiceModal>.
import { useState } from "react"
import { Lightbulb, Search } from "lucide-react"
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CandidateList } from "@/components/reconcile/CandidateList"
import { normalizeMerchant } from "@/lib/matching"
import { fmtMoney } from "@/lib/money"
import { fmtDate } from "@/lib/date"
import type { CandidateResult } from "@/api-types/reconcile"
import type { TransactionRow } from "@/components/reconcile/types"

export function FindInvoiceModalBody({ transaction, range, linking, onLink }: {
  transaction: TransactionRow
  range: { from: string; to: string }
  linking: boolean
  onLink: (candidate: CandidateResult) => void
}) {
  // Pre-filled with the cleaned-up merchant guess; remounted per transaction
  const [search, setSearch] = useState(() => normalizeMerchant(transaction.merchant))

  return (
    <DialogContent className="sm:max-w-[540px] p-0 gap-0 bg-white border-border rounded-[16px]">
          <DialogHeader className="px-[22px] pt-[20px] pb-[14px] border-b border-hover">
            <DialogTitle className="text-[16px] font-[700] text-heading">
              Find invoice
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-text-secondary">
              Matching{" "}
              <span className="font-mono font-[600] text-foreground">{transaction.merchant}</span>
              {" · "}{fmtMoney(transaction.amount, transaction.currency)}
              {" · "}{fmtDate(transaction.date)}
            </DialogDescription>
          </DialogHeader>

          <div className="p-[22px] flex flex-col gap-[14px]">
            <div className="relative">
              <Search size={14} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-dim" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor or invoice #…"
                className="h-auto pl-[34px] pr-3 py-[9px] text-[13.5px] text-text-primary border-border rounded-[10px] bg-background"
              />
            </div>

            <p className="text-[11px] font-[700] text-text-secondary uppercase tracking-[0.05em]">
              Suggested matches
            </p>

            <CandidateList
              transaction={transaction}
              range={range}
              search={search}
              disabled={linking}
              onLink={onLink}
            />

            <div className="flex items-center gap-[7px] text-[11.5px] text-dim border-t border-hover pt-[13px]">
              <Lightbulb size={13} strokeWidth={1.5} className="shrink-0" />
              <span>Linking teaches a vendor alias, so future charges from this merchant match automatically.</span>
            </div>
          </div>
    </DialogContent>
  )
}
