// Client component by import — only ever rendered from <FindInvoiceModal>.
import { useState } from "react"
import { Lightbulb, Search } from "lucide-react"
import { useT } from "@/components/i18n/LocaleProvider"
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
  const t = useT()
  // Pre-filled with the cleaned-up merchant guess; remounted per transaction
  const [search, setSearch] = useState(() => normalizeMerchant(transaction.merchant))

  return (
    <DialogContent className="sm:max-w-135 p-0 gap-0 bg-white border-border rounded-2xl">
          <DialogHeader className="px-5.5 pt-5 pb-3.5 border-b border-hover">
            <DialogTitle className="text-base font-bold text-heading">
              {t("reconcile.find.title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              {t("reconcile.find.matching")}{" "}
              <span className="font-mono font-semibold text-foreground">{transaction.merchant}</span>
              {" · "}{fmtMoney(transaction.amount, transaction.currency)}
              {" · "}{fmtDate(transaction.date)}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5.5 flex flex-col gap-3.5">
            <div className="relative">
              <Search size={14} className="absolute inset-s-2.75 top-1/2 -translate-y-1/2 text-dim" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("reconcile.find.searchPlaceholder")}
                className="h-auto ps-8.5 pe-3 py-2.25 text-sm text-text-primary border-border rounded-[10px] bg-background"
              />
            </div>

            <p className="text-xs font-bold text-text-secondary">
              {t("reconcile.find.suggestedMatches")}
            </p>

            <CandidateList
              transaction={transaction}
              range={range}
              search={search}
              disabled={linking}
              onLink={onLink}
            />

            <div className="flex items-center gap-1.75 text-xs text-dim border-t border-hover pt-3.25">
              <Lightbulb size={13} strokeWidth={1.5} className="shrink-0" />
              <span>{t("reconcile.find.aliasHint")}</span>
            </div>
          </div>
    </DialogContent>
  )
}
