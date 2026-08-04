"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Repeat } from "lucide-react"
import { Sheet } from "@/components/ui/sheet"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CategoryBadge } from "@/components/invoices/CategoryBadge"
import { fmtAmount } from "@/components/invoices/helpers"
import { FREQUENCY_LABELS } from "@/lib/fixed-expense-meta"
import { FixedExpenseStatusBadge } from "./FixedExpenseStatusBadge"
import { FixedExpenseFormDialog } from "./FixedExpenseFormDialog"
import { FixedExpenseDetailDrawer } from "./FixedExpenseDetailDrawer"
import type { FixedExpenseRow } from "./types"

const GRID = "1.4fr 1.2fr 1fr 0.9fr 0.9fr 0.9fr"

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
]

export function FixedExpensesClient({
  expenses,
  mailboxes,
}: {
  expenses: FixedExpenseRow[]
  mailboxes: { id: string; label: string }[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selected, setSelected] = useState<FixedExpenseRow | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FixedExpenseRow | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return expenses.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        (e.vendorName ?? "").toLowerCase().includes(q) ||
        (e.senderEmail ?? "").toLowerCase().includes(q)
      const matchStatus = statusFilter === "all" || e.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [expenses, search, statusFilter])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(expense: FixedExpenseRow) {
    setSelected(null)
    setEditing(expense)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-[10px]">
        <div className="relative flex-1 max-w-[320px]">
          <Search size={15} strokeWidth={1.8} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-dim" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fixed expenses…"
            className="h-auto pl-[32px] pr-[11px] py-[8px] text-[13px] border-border rounded-[10px] bg-surface"
          />
        </div>
        <Select
          items={STATUS_OPTIONS}
          value={statusFilter}
          onValueChange={(v) => v && setStatusFilter(v)}
        >
          <SelectTrigger className="h-auto py-[8px] px-[11px] text-[13px] border-border rounded-[10px] bg-surface w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={openCreate} className="h-auto py-[8px] px-[14px] rounded-[10px] text-[13px] font-[600]">
          <Plus size={15} strokeWidth={2} />
          New fixed expense
        </Button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div
          className="grid px-[18px] py-[12px] bg-[#F8FAFF] border-b border-border"
          style={{ gridTemplateColumns: GRID, gap: "12px" }}
        >
          {["Name", "Source", "Category", "Frequency", "Expected", "This period"].map((h) => (
            <span key={h} className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-text-secondary">
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState onCreate={openCreate} hasAny={expenses.length > 0} />
        ) : (
          filtered.map((expense) => (
            <button
              key={expense.id}
              type="button"
              onClick={() => setSelected(expense)}
              className="grid w-full items-center px-[18px] py-[13px] border-b border-hover last:border-b-0 text-left hover:bg-hover transition-colors"
              style={{ gridTemplateColumns: GRID, gap: "12px" }}
            >
              <span className="min-w-0">
                <span className="block text-[13.5px] font-[600] text-heading truncate">{expense.name}</span>
                {expense.status === "PAUSED" && (
                  <span className="text-[11px] font-[700] text-dim uppercase tracking-[0.04em]">Paused</span>
                )}
              </span>
              <span className="text-[13px] text-text-secondary truncate">
                {expense.vendorName ?? expense.senderEmail ?? "—"}
              </span>
              <span className="min-w-0"><CategoryBadge category={expense.category} /></span>
              <span className="text-[13px] text-text-secondary">{FREQUENCY_LABELS[expense.frequency]}</span>
              <span className="text-[13px] text-text-primary font-[600]">
                {expense.expectedAmount ? fmtAmount(expense.expectedAmount, expense.currency) : "—"}
              </span>
              <span className="min-w-0"><FixedExpenseStatusBadge status={expense.currentStatus} /></span>
            </button>
          ))
        )}
      </div>

      {/* Create / edit form */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) setFormOpen(false) }}>
        {formOpen && (
          <FixedExpenseFormDialog
            expense={editing ?? undefined}
            mailboxes={mailboxes}
            onClose={() => setFormOpen(false)}
            onSaved={() => router.refresh()}
          />
        )}
      </Dialog>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        {selected && (
          <FixedExpenseDetailDrawer
            key={selected.id}
            expense={selected}
            onEdit={() => openEdit(selected)}
            onDismiss={() => setSelected(null)}
          />
        )}
      </Sheet>
    </div>
  )
}

// Client component by import — only ever rendered from <FixedExpensesClient>.
function EmptyState({ onCreate, hasAny }: { onCreate: () => void; hasAny: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-[56px] px-6">
      <div className="w-[46px] h-[46px] rounded-[14px] bg-info-bg flex items-center justify-center mb-[14px]">
        <Repeat size={20} strokeWidth={1.8} className="text-primary" />
      </div>
      <p className="text-[15px] font-[700] text-heading mb-[4px]">
        {hasAny ? "No matching fixed expenses" : "Track your recurring bills"}
      </p>
      <p className="text-[13px] text-text-secondary max-w-[340px] mb-[16px]">
        {hasAny
          ? "Try a different search or filter."
          : "Add a fixed expense and we'll tell you each period whether its invoice has arrived."}
      </p>
      {!hasAny && (
        <Button onClick={onCreate} className="h-auto py-[8px] px-[14px] rounded-[10px] text-[13px] font-[600]">
          <Plus size={15} strokeWidth={2} />
          New fixed expense
        </Button>
      )}
    </div>
  )
}
