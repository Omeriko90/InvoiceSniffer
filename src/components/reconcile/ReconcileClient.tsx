"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { GitMerge } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTransactionAction } from "@/hooks/useTransactionAction"
import { FindInvoiceModal } from "@/components/reconcile/FindInvoiceModal"
import { MatchDrawer } from "@/components/reconcile/MatchDrawer"
import { fmtMoney } from "@/lib/money"

// ── Types ────────────────────────────────────────────────────────────

export type TransactionRow = {
  id: string
  date: string
  merchant: string
  amount: string
  currency: string
  status: "UNMATCHED" | "POSSIBLE" | "MATCHED" | "NO_INVOICE"
  matchConfidence: number | null
  matchReason: string | null
  matchConfirmed: boolean
  sourceFile: string | null
  invoice: {
    id: string
    vendorName: string | null
    invoiceNumber: string | null
    amount: string
    currency: string
    date: string
    dueDate: string | null
    senderEmail: string
    gmailLink: string
  } | null
}

type TabId = "all" | "matched" | "possible" | "missing" | "none"

// ── Helpers ──────────────────────────────────────────────────────────

const GRID = { gridTemplateColumns: ".7fr 1.5fr .8fr 1.7fr 1fr 1.6fr", gap: "14px" }

const TAB_FOR_STATUS: Record<TransactionRow["status"], TabId> = {
  MATCHED: "matched",
  POSSIBLE: "possible",
  UNMATCHED: "missing",
  NO_INVOICE: "none",
}

const STATUS_META: Record<
  TransactionRow["status"],
  { label: string; bg: string; color: string; barColor: string }
> = {
  MATCHED:    { label: "Matched",    bg: "#ECFDF5", color: "#059669", barColor: "#34D399" },
  POSSIBLE:   { label: "Possible",   bg: "#FFFBEB", color: "#B45309", barColor: "#FBBF24" },
  UNMATCHED:  { label: "Missing",    bg: "#FEF2F2", color: "#DC2626", barColor: "#FB7171" },
  NO_INVOICE: { label: "No invoice", bg: "#F1F3F8", color: "#64748B", barColor: "#CBD5E1" },
}

function invoiceLabel(txn: TransactionRow): { text: string; muted: boolean } {
  if (txn.invoice) {
    const vendor = txn.invoice.vendorName ?? "Unknown vendor"
    return {
      text: txn.invoice.invoiceNumber ? `${vendor} — ${txn.invoice.invoiceNumber}` : vendor,
      muted: false,
    }
  }
  if (txn.status === "NO_INVOICE") return { text: "No invoice required", muted: true }
  return { text: "No invoice found", muted: true }
}

// ── Action buttons ───────────────────────────────────────────────────

type ActionVariant = "outline" | "neutral" | "green" | "blue" | "find"

const ACTION_STYLES: Record<ActionVariant, React.CSSProperties> = {
  outline: { border: "1px solid #E8EDFA", background: "#fff", color: "#94A3B8" },
  neutral: { border: "1px solid #E8EDFA", background: "#fff", color: "#475569" },
  green:   { border: "1px solid #34D399", background: "#34D399", color: "#fff" },
  blue:    { border: "1px solid #7AA7FF", background: "#7AA7FF", color: "#fff" },
  find:    { border: "1px solid #BFDBFF", background: "#fff", color: "#3B6FE0" },
}

function ActionButton({
  variant,
  onClick,
  disabled,
  children,
}: {
  variant: ActionVariant
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-[12px] font-[600] px-[11px] py-[6px] rounded-[8px] whitespace-nowrap cursor-pointer transition-[filter] hover:brightness-[1.04] disabled:opacity-50 disabled:cursor-default"
      style={ACTION_STYLES[variant]}
    >
      {children}
    </button>
  )
}

// ── Empty state ──────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-14 h-14 rounded-xl bg-[#F1F3F8] flex items-center justify-center mb-4">
        <GitMerge size={26} strokeWidth={1.5} className="text-[#94A3B8]" />
      </div>
      <p className="text-[16px] font-[700] text-heading mb-2">Nothing to reconcile yet</p>
      <p className="text-[13.5px] text-text-secondary text-center max-w-[340px] leading-[1.6] mb-6">
        Import a bank or credit-card CSV and we&apos;ll match every charge against your detected
        invoices automatically.
      </p>
      <Button
        nativeButton={false}
        render={<Link href="/import" />}
        className="h-auto px-[18px] py-[10px] rounded-[10px] text-[13.5px] font-[700] text-white border-0"
        style={{
          background: "linear-gradient(135deg,#7AA7FF,#88D0FF)",
          boxShadow: "0 4px 12px rgba(122,167,255,.3)",
        }}
      >
        Import a CSV
      </Button>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────

export function ReconcileClient({ transactions }: { transactions: TransactionRow[] }) {
  const [tab, setTab] = useState<TabId>("all")
  const [findFor, setFindFor] = useState<TransactionRow | null>(null)
  const [detailFor, setDetailFor] = useState<TransactionRow | null>(null)
  const action = useTransactionAction()

  // Keep the open drawer in sync with fresh transaction data after an action
  const detailTxn = detailFor
    ? transactions.find((t) => t.id === detailFor.id) ?? null
    : null

  const tabs = useMemo(() => {
    const count = (t: TabId) =>
      transactions.filter((txn) => TAB_FOR_STATUS[txn.status] === t).length
    return [
      { id: "all" as TabId, label: "All", count: transactions.length },
      { id: "matched" as TabId, label: "Matched", count: count("matched") },
      { id: "possible" as TabId, label: "Possible", count: count("possible") },
      { id: "missing" as TabId, label: "Missing", count: count("missing") },
      { id: "none" as TabId, label: "No invoice", count: count("none") },
    ]
  }, [transactions])

  const filtered = tab === "all"
    ? transactions
    : transactions.filter((txn) => TAB_FOR_STATUS[txn.status] === tab)

  const run = (id: string, a: "confirm" | "reject" | "no_invoice" | "undo") =>
    action.mutate({ id, action: a })

  return (
    <div className="flex flex-col">
      {/* Status tabs */}
      <div className="flex items-center gap-[6px] mb-4 bg-white border border-[#E8EDFA] rounded-[12px] p-[5px] w-fit">
        {tabs.map((t) => {
          const on = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-[7px] px-[14px] py-[7px] rounded-[9px] cursor-pointer text-[13.5px] font-[600] transition-colors"
              style={{ background: on ? "#EEF3FF" : "transparent", color: on ? "#3B6FE0" : "#64748B" }}
            >
              {t.label}
              <span
                className="text-[11px] font-[700] px-[7px] rounded-full"
                style={{
                  background: on ? "#7AA7FF" : "#F1F3F8",
                  color: on ? "#fff" : "#94A3B8",
                }}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8EDFA] rounded-[14px] overflow-hidden">
        {/* Header */}
        <div className="grid px-[18px] py-[12px] bg-[#F8FAFF] border-b border-[#E8EDFA]" style={GRID}>
          {["Date", "Merchant", "Amount", "Matched invoice", "Confidence", "Actions"].map((h, i) => (
            <span
              key={h}
              className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-[#64748B]"
              style={i === 2 || i === 5 ? { textAlign: "right" } : undefined}
            >
              {h}
            </span>
          ))}
        </div>

        {transactions.length === 0 && <EmptyState />}

        {transactions.length > 0 && filtered.length === 0 && (
          <div className="py-12 text-center text-[13.5px] text-[#94A3B8]">
            No transactions in this view
          </div>
        )}

        {filtered.map((txn) => {
          const meta = STATUS_META[txn.status]
          const inv = invoiceLabel(txn)
          const pct = txn.matchConfidence !== null ? Math.round(txn.matchConfidence * 100) : null
          const showBar = pct !== null && (txn.status === "MATCHED" || txn.status === "POSSIBLE")
          const pending = action.isPending && action.variables?.id === txn.id

          return (
            <div
              key={txn.id}
              onClick={() => setDetailFor(txn)}
              className="grid items-center px-[18px] py-[14px] border-b border-[#F1F3F8] last:border-b-0 hover:bg-[#FAFBFF] transition-colors cursor-pointer"
              style={GRID}
            >
              {/* Date */}
              <span className="text-[13px] text-[#64748B]">
                {format(new Date(txn.date), "MMM d")}
              </span>

              {/* Merchant */}
              <span className="text-[13px] font-[600] text-[#334155] font-mono truncate">
                {txn.merchant}
              </span>

              {/* Amount */}
              <span className="text-[13.5px] font-[700] text-heading text-right">
                {fmtMoney(txn.amount, txn.currency)}
              </span>

              {/* Matched invoice */}
              <div className="min-w-0">
                <div
                  className="text-[13px] font-[600] truncate"
                  style={{ color: inv.muted ? "#94A3B8" : "#334155" }}
                >
                  {inv.text}
                </div>
                {txn.matchReason && (
                  <div className="text-[11.5px] text-[#94A3B8] truncate">{txn.matchReason}</div>
                )}
              </div>

              {/* Confidence */}
              <div>
                <Badge
                  className="rounded-full h-auto text-[11.5px] font-[700] px-[10px] py-[2px]"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {txn.matchConfirmed && txn.status === "MATCHED" ? "Confirmed" : meta.label}
                </Badge>
                {showBar && (
                  <div className="flex items-center gap-[6px] mt-[5px]">
                    <div className="flex-1 h-[5px] bg-[#F1F3F8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: meta.barColor }}
                      />
                    </div>
                    <span className="text-[11px] font-[600] text-[#94A3B8]">{pct}%</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-[6px] justify-end" onClick={(e) => e.stopPropagation()}>
                {txn.status === "MATCHED" && !txn.matchConfirmed && (
                  <>
                    <ActionButton variant="outline" disabled={pending} onClick={() => run(txn.id, "reject")}>
                      ✕ Reject
                    </ActionButton>
                    <ActionButton variant="green" disabled={pending} onClick={() => run(txn.id, "confirm")}>
                      ✓ Confirm
                    </ActionButton>
                  </>
                )}
                {txn.status === "MATCHED" && txn.matchConfirmed && (
                  <ActionButton variant="outline" disabled={pending} onClick={() => run(txn.id, "undo")}>
                    Undo
                  </ActionButton>
                )}
                {txn.status === "POSSIBLE" && (
                  <>
                    <ActionButton variant="neutral" disabled={pending} onClick={() => setFindFor(txn)}>
                      Change
                    </ActionButton>
                    <ActionButton variant="blue" disabled={pending} onClick={() => run(txn.id, "confirm")}>
                      Confirm
                    </ActionButton>
                  </>
                )}
                {txn.status === "UNMATCHED" && (
                  <>
                    <ActionButton variant="outline" disabled={pending} onClick={() => run(txn.id, "no_invoice")}>
                      No invoice
                    </ActionButton>
                    <ActionButton variant="find" disabled={pending} onClick={() => setFindFor(txn)}>
                      Find invoice
                    </ActionButton>
                  </>
                )}
                {txn.status === "NO_INVOICE" && (
                  <ActionButton variant="outline" disabled={pending} onClick={() => run(txn.id, "undo")}>
                    Undo
                  </ActionButton>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Match confirmation drawer */}
      <MatchDrawer
        transaction={detailTxn}
        onClose={() => setDetailFor(null)}
        onRun={run}
        onFind={(txn) => {
          setDetailFor(null)
          setFindFor(txn)
        }}
        pending={action.isPending}
      />

      {/* Find / change invoice modal */}
      <FindInvoiceModal transaction={findFor} onClose={() => setFindFor(null)} />
    </div>
  )
}
