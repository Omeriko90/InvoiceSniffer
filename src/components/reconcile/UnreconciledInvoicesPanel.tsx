// Client component by import — only ever rendered from <ReconcileSession>.
import { ExternalLink, FileText } from "lucide-react"
import { useT } from "@/components/i18n/LocaleProvider"
import { fmtMoney } from "@/lib/money"
import { useFmtDate } from "@/components/i18n/LocaleProvider"
import type { MatchInvoice } from "@/api-types/reconcile"

// Invoices in the selected window that no uploaded charge matched — i.e. you may
// be missing a bank/card charge for them, or haven't uploaded the right file.
export function UnreconciledInvoicesPanel({ invoices }: { invoices: MatchInvoice[] }) {
  const t = useT()
  const { fmtDate } = useFmtDate()
  if (invoices.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg flex flex-col items-center justify-center py-16 px-8">
        <div className="w-14 h-14 rounded-xl bg-hover flex items-center justify-center mb-4">
          <FileText size={26} strokeWidth={1.5} className="text-dim" />
        </div>
        <p className="text-base font-bold text-heading mb-1">{t("reconcile.unreconciled.emptyTitle")}</p>
        <p className="text-sm text-text-secondary text-center max-w-[340px] leading-[1.6]">
          {t("reconcile.unreconciled.emptyDescription")}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div
        className="grid px-[18px] py-3 bg-raised border-b border-border"
        style={{ gridTemplateColumns: "1.8fr 1fr .9fr 1fr .8fr", gap: "14px" }}
      >
        {[t("reconcile.unreconciled.vendor"), t("reconcile.unreconciled.invoiceNumber"), t("reconcile.unreconciled.amount"), t("reconcile.unreconciled.date"), ""].map((h, i) => (
          <span
            key={i}
            className="text-xs font-bold text-text-secondary"
            style={i === 2 ? { textAlign: "right" } : undefined}
          >
            {h}
          </span>
        ))}
      </div>

      {invoices.map((inv) => (
        <div
          key={inv.id}
          className="grid items-center px-[18px] py-3.5 border-b border-hover last:border-b-0"
          style={{ gridTemplateColumns: "1.8fr 1fr .9fr 1fr .8fr", gap: "14px" }}
        >
          <span className="text-sm font-semibold text-foreground truncate">
            {inv.vendorName ?? t("reconcile.unknownVendor")}
          </span>
          <span className="text-sm text-text-secondary font-mono truncate">
            {inv.invoiceNumber ?? "—"}
          </span>
          <span className="text-sm font-bold text-heading text-end">
            {fmtMoney(inv.amount, inv.currency)}
          </span>
          <span className="text-sm text-text-secondary">
            {fmtDate(inv.date)}
          </span>
          <a
            href={inv.gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[5px] text-xs font-semibold text-primary-strong hover:underline justify-end"
          >
            <ExternalLink size={13} />
            {t("reconcile.unreconciled.email")}
          </a>
        </div>
      ))}
    </div>
  )
}
