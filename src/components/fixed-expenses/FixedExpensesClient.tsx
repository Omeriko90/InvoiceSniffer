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
        e.vendorName.some((v) => v.toLowerCase().includes(q)) ||
        e.senderEmail.some((s) => s.toLowerCase().includes(q))
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
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 max-w-[320px]">
          <Search size={15} strokeWidth={1.8} className="absolute start-2.75 top-1/2 -translate-y-1/2 text-dim" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fixed expenses…"
            className="h-auto ps-8.5 pe-2.75 py-2 text-sm border-border rounded-lg bg-surface"
          />
        </div>
        <Select
          items={STATUS_OPTIONS}
          value={statusFilter}
          onValueChange={(v) => v && setStatusFilter(v)}
        >
          <SelectTrigger className="h-auto py-2 px-2.75 text-sm border-border rounded-[10px] bg-surface w-30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={openCreate}>
          <Plus size={15} strokeWidth={2} />
          New fixed expense
        </Button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div
          className="grid px-4.5 py-3 bg-background border-b border-border"
          style={{ gridTemplateColumns: GRID, gap: "12px" }}
        >
          {["Name", "Source", "Category", "Frequency", "Expected", "This period"].map((h) => (
            <span key={h} className="text-xs font-bold text-text-secondary">
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState onCreate={openCreate} hasAny={expenses.length > 0} />
        ) : (
          filtered.map((expense) => (
            <Button
              key={expense.id}
              type="button"
              variant="ghost"
              onClick={() => setSelected(expense)}
              className="grid w-full h-auto justify-normal rounded-none items-center px-4.5 py-3 border-b border-hover last:border-b-0 text-left hover:bg-hover transition-colors"
              style={{ gridTemplateColumns: GRID, gap: "12px" }}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-heading truncate">{expense.name}</span>
                {expense.status === "PAUSED" && (
                  <span className="text-xs font-bold text-dim">Paused</span>
                )}
              </span>
              <span className="text-sm text-text-secondary truncate">
                {expense.vendorName ?? expense.senderEmail ?? "—"}
              </span>
              <span className="min-w-0"><CategoryBadge category={expense.category} /></span>
              <span className="text-sm text-text-secondary">{FREQUENCY_LABELS[expense.frequency]}</span>
              <span className="text-sm text-text-primary font-semibold">
                {expense.expectedAmount ? fmtAmount(expense.expectedAmount, expense.currency) : "—"}
              </span>
              <span className="min-w-0"><FixedExpenseStatusBadge status={expense.currentStatus} /></span>
            </Button>
          ))
        )}
      </div>

      {/* Create / edit form */}
      <Dialog name="fixed_expense_form" open={formOpen} onOpenChange={(open) => { if (!open) setFormOpen(false) }}>
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
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-11.5 h-11.5 rounded-lg bg-info-bg flex items-center justify-center mb-3.5">
        <Repeat size={20} strokeWidth={1.8} className="text-primary" />
      </div>
      <p className="text-base font-bold text-heading mb-1">
        {hasAny ? "No matching fixed expenses" : "Track your recurring bills"}
      </p>
      <p className="text-sm text-text-secondary max-w-85 mb-4">
        {hasAny
          ? "Try a different search or filter."
          : "Add a fixed expense and we'll tell you each period whether its invoice has arrived."}
      </p>
      {!hasAny && (
        <Button onClick={onCreate}>
          <Plus size={15} strokeWidth={2} />
          New fixed expense
        </Button>
      )}
    </div>
  )
}
