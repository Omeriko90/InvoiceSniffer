"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, FileText, Lock, Search } from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useGmailSync } from "@/hooks/useGmailSync"
import { useUpdateInvoice } from "@/hooks/useUpdateInvoice"

// ── Types ────────────────────────────────────────────────────────────

export type InvoiceRow = {
  id: string
  vendorName: string | null
  invoiceNumber: string | null
  totalAmount: string
  currency: string
  emailDate: string
  invoiceDate: string | null
  dueDate: string | null
  extractionConfidence: number
  status: "DETECTED" | "MATCHED" | "UNMATCHED" | "REVIEWED" | "IGNORED"
  gmailLink: string
  senderEmail: string
  senderName: string | null
  subject: string
  attachmentMeta: AttachmentMeta[]
  receiptUrl: string | null
}

type AttachmentMeta = {
  filename: string
  mimeType: string
  size: number
}

// ── Helpers ──────────────────────────────────────────────────────────

const VENDOR_GRADIENTS = [
  "linear-gradient(135deg,#34D399,#22D3EE)",
  "linear-gradient(135deg,#FB7171,#A78BFA)",
  "linear-gradient(135deg,#FBBF24,#FB7171)",
  "linear-gradient(135deg,#334155,#64748B)",
  "linear-gradient(135deg,#7AA7FF,#A78BFA)",
  "linear-gradient(135deg,#A78BFA,#7AA7FF)",
  "linear-gradient(135deg,#22D3EE,#7AA7FF)",
]

function vendorGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff
  return VENDOR_GRADIENTS[Math.abs(hash) % VENDOR_GRADIENTS.length]
}

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase()
}

function confidenceColor(pct: number): string {
  if (pct >= 0.9) return "#34D399"
  if (pct >= 0.75) return "#FBBF24"
  return "#FB7171"
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  MATCHED:   { label: "Confirmed",  bg: "#ECFDF5", color: "#059669" },
  UNMATCHED: { label: "Review",     bg: "#FEF2F2", color: "#DC2626" },
  DETECTED:  { label: "Detected",   bg: "#EFF6FF", color: "#2563EB" },
  REVIEWED:  { label: "Reviewed",   bg: "#F5F3FF", color: "#7C3AED" },
  IGNORED:   { label: "Ignored",    bg: "#F1F3F8", color: "#94A3B8" },
}

function fmtAmount(amount: string, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount))
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ── Shared bits ──────────────────────────────────────────────────────

function VendorAvatar({ vendor, className }: { vendor: string; className?: string }) {
  return (
    <Avatar className={className ?? "size-7"}>
      <AvatarFallback
        className="text-white text-[12px] font-[700]"
        style={{ background: vendorGradient(vendor) }}
      >
        {initials(vendor)}
      </AvatarFallback>
    </Avatar>
  )
}

function StatusBadge({ status }: { status: { label: string; bg: string; color: string } }) {
  return (
    <Badge
      className="rounded-full h-auto text-[11.5px] font-[700] px-[10px] py-[2px]"
      style={{ background: status.bg, color: status.color }}
    >
      {status.label}
    </Badge>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      className="grid items-center px-[18px] py-[13px] border-b border-[#F1F3F8]"
      style={{ gridTemplateColumns: "1.6fr 1fr 0.8fr 0.7fr 1.1fr 0.9fr 40px", gap: "12px" }}
    >
      <div className="flex items-center gap-[10px]">
        <Skeleton className="w-7 h-7 rounded-full bg-[#EEF1F8] shrink-0" />
        <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "62%" }} />
      </div>
      <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "70%" }} />
      <Skeleton className="h-3 bg-[#EEF1F8] ml-auto" style={{ width: "60%" }} />
      <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "50%" }} />
      <Skeleton className="h-[6px] rounded-full bg-[#EEF1F8]" style={{ width: "90%" }} />
      <Skeleton className="h-5 rounded-full bg-[#EEF1F8]" style={{ width: "64px" }} />
      <div />
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────

function EmptyState() {
  const sync = useGmailSync()
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-14 h-14 rounded-xl bg-[#F1F3F8] flex items-center justify-center mb-4">
        <FileText size={26} strokeWidth={1.5} className="text-[#94A3B8]" />
      </div>
      <p className="text-[16px] font-[700] text-heading mb-2">No invoices yet</p>
      <p className="text-[13.5px] text-text-secondary text-center max-w-[340px] leading-[1.6] mb-6">
        Once your Gmail is connected, detected invoices will appear here automatically. Nothing has been scanned yet.
      </p>
      <Button
        onClick={() => sync.mutate()}
        disabled={sync.isPending}
        className="h-auto px-[18px] py-[10px] rounded-[10px] text-[13.5px] font-[700] text-white border-0"
        style={{
          background: "linear-gradient(135deg,#7AA7FF,#88D0FF)",
          boxShadow: "0 4px 12px rgba(122,167,255,.3)",
        }}
      >
        {sync.isPending ? "Starting…" : "Run a Gmail sync"}
      </Button>
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────

function toDraft(inv: InvoiceRow) {
  return {
    vendorName: inv.vendorName ?? "",
    invoiceNumber: inv.invoiceNumber ?? "",
    totalAmount: inv.totalAmount,
    invoiceDate: inv.invoiceDate?.slice(0, 10) ?? "",
    dueDate: inv.dueDate?.slice(0, 10) ?? "",
  }
}

function InvoiceDrawer({ invoice, onSaved }: { invoice: InvoiceRow; onSaved: (updated: InvoiceRow) => void }) {
  const router = useRouter()
  const update = useUpdateInvoice()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => toDraft(invoice))

  const vendor = invoice.vendorName ?? invoice.senderName ?? invoice.senderEmail
  const status = STATUS_META[invoice.status] ?? STATUS_META.DETECTED
  const pct = Math.round(invoice.extractionConfidence * 100)

  const amountValid =
    draft.totalAmount.trim() !== "" &&
    Number.isFinite(Number(draft.totalAmount)) &&
    Number(draft.totalAmount) >= 0

  function setField(field: keyof ReturnType<typeof toDraft>, value: string) {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  function handleSave() {
    const data = {
      vendorName: draft.vendorName.trim() || null,
      invoiceNumber: draft.invoiceNumber.trim() || null,
      totalAmount: draft.totalAmount.trim(),
      invoiceDate: draft.invoiceDate || null,
      dueDate: draft.dueDate || null,
    }
    update.mutate(
      { id: invoice.id, data },
      {
        onSuccess: () => {
          setEditing(false)
          onSaved({
            ...invoice,
            vendorName: data.vendorName,
            invoiceNumber: data.invoiceNumber,
            totalAmount: data.totalAmount,
            invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toISOString() : null,
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          })
          router.refresh()
        },
      }
    )
  }

  return (
    <SheetContent
      side="right"
      className="w-[440px] sm:max-w-[440px] gap-0 bg-white border-l border-[#E8EDFA]"
      style={{ boxShadow: "-12px 0 40px rgba(80,110,180,.12)" }}
    >
      {/* Drawer header */}
      <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-[#F1F3F8] shrink-0">
        <div className="flex items-center gap-[11px] min-w-0 pr-8">
          <VendorAvatar vendor={vendor} />
          <div className="min-w-0">
            <SheetTitle className="text-[15px] font-[700] text-heading truncate">{vendor}</SheetTitle>
            {invoice.invoiceNumber && (
              <p className="text-[12px] text-[#94A3B8] font-mono">{invoice.invoiceNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-[22px]">
        {/* Amount */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[30px] font-[800] text-heading tracking-[-0.02em] leading-none">
            {fmtAmount(invoice.totalAmount, invoice.currency)}
          </span>
          <StatusBadge status={status} />
        </div>
        <p className="text-[12.5px] text-[#94A3B8] mb-6">
          Extraction confidence: {pct}%
        </p>

        {/* Extracted fields */}
        <p className="text-[11px] font-[700] text-[#64748B] uppercase tracking-[0.05em] mb-2">
          Extracted fields
        </p>
        {editing ? (
        <div className="flex flex-col gap-[13px] border border-[#E8EDFA] rounded-[11px] p-[13px] mb-[22px]">
          {[
            { field: "vendorName" as const,    label: "Vendor",       type: "text" },
            { field: "invoiceNumber" as const, label: "Invoice #",    type: "text" },
            { field: "totalAmount" as const,   label: `Amount (${invoice.currency})`, type: "number" },
            { field: "invoiceDate" as const,   label: "Invoice date", type: "date" },
            { field: "dueDate" as const,       label: "Due date",     type: "date" },
          ].map((f) => (
            <div key={f.field} className="flex flex-col gap-[5px]">
              <Label
                htmlFor={`edit-${f.field}`}
                className="text-[12px] font-[600] text-[#64748B]"
              >
                {f.label}
              </Label>
              <Input
                id={`edit-${f.field}`}
                type={f.type}
                step={f.type === "number" ? "0.01" : undefined}
                min={f.type === "number" ? "0" : undefined}
                value={draft[f.field]}
                onChange={(e) => setField(f.field, e.target.value)}
                className="h-auto px-[11px] py-[7px] text-[13px] text-text-primary border-[#E8EDFA] rounded-[9px]"
              />
            </div>
          ))}
        </div>
        ) : (
        <div className="border border-[#E8EDFA] rounded-[11px] overflow-hidden mb-[22px]">
          {[
            { label: "Invoice #", value: invoice.invoiceNumber ?? "—", mono: true },
            { label: "Amount",    value: fmtAmount(invoice.totalAmount, invoice.currency) },
            { label: "Invoice date", value: invoice.invoiceDate ? format(new Date(invoice.invoiceDate), "MMM d, yyyy") : "—" },
            // Most receipts are already paid, so a missing due date means
            // "not applicable" — hide the row rather than show a dash
            ...(invoice.dueDate
              ? [{ label: "Due date", value: format(new Date(invoice.dueDate), "MMM d, yyyy") }]
              : []),
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-[13px] py-[10px] text-[13px]"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid #F1F3F8" : undefined }}
            >
              <span className="text-[#64748B]">{row.label}</span>
              <span
                className="font-[600] text-[#334155]"
                style={row.mono ? { fontFamily: "var(--font-mono)" } : undefined}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
        )}

        {/* Source email */}
        <p className="text-[11px] font-[700] text-[#64748B] uppercase tracking-[0.05em] mb-2">
          Source email
        </p>
        <div className="border border-[#E8EDFA] rounded-[11px] p-[13px] mb-[22px]">
          <p className="text-[13px] font-[600] text-[#334155] leading-snug">{invoice.subject}</p>
          <p className="text-[12.5px] text-[#64748B] mt-1">{invoice.senderEmail}</p>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">
            {format(new Date(invoice.emailDate), "MMM d, yyyy")}
          </p>
        </div>

        {/* Attachments — served on demand from Gmail, never stored */}
        {invoice.attachmentMeta.length > 0 && (
          <p className="text-[11px] font-[700] text-[#64748B] uppercase tracking-[0.05em] mb-2">
            Attached documents
          </p>
        )}
        {invoice.attachmentMeta.length > 0 && invoice.attachmentMeta.map((att, i) => (
          <a
            key={i}
            href={`/api/invoices/${invoice.id}/attachments/${i}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[10px] bg-[#F8FAFF] border border-[#E8EDFA] rounded-[11px] p-[11px_13px] mb-[14px] hover:bg-[#EFF6FF] transition-colors"
          >
            <div className="w-[34px] h-[34px] rounded-lg bg-[#FEF2F2] flex items-center justify-center shrink-0">
              <FileText size={16} strokeWidth={1.5} className="text-[#FB7171]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[600] text-[#334155] truncate">{att.filename}</p>
              <p className="text-[11.5px] text-[#94A3B8]">{fmtSize(att.size)}</p>
            </div>
            <ExternalLink size={14} strokeWidth={1.5} className="text-[#94A3B8] shrink-0" />
          </a>
        ))}

        {/* Hosted receipt link */}
        {invoice.receiptUrl && (
          <p className="text-[11px] font-[700] text-[#64748B] uppercase tracking-[0.05em] mb-2">
            Receipt link
          </p>
        )}
        {invoice.receiptUrl && (
          <a
            href={invoice.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[10px] bg-[#F8FAFF] border border-[#E8EDFA] rounded-[11px] p-[11px_13px] mb-[14px] hover:bg-[#EFF6FF] transition-colors"
          >
            <div className="w-[34px] h-[34px] rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <ExternalLink size={16} strokeWidth={1.5} className="text-[#3B6FE0]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[600] text-[#334155]">View hosted receipt</p>
              <p className="text-[11.5px] text-[#94A3B8] truncate">{new URL(invoice.receiptUrl).hostname}</p>
            </div>
          </a>
        )}

        {/* Privacy note */}
        <div className="flex items-center gap-[7px] text-[11.5px] text-[#94A3B8]">
          <Lock size={13} strokeWidth={1.5} className="shrink-0" />
          <span>The file itself is never stored — it&apos;s fetched from Gmail only during an export.</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-[10px] px-[22px] py-[16px] border-t border-[#F1F3F8] shrink-0">
        {editing ? (
          <>
            <Button
              variant="outline"
              className="flex-1 h-auto py-[10px] rounded-[10px] border-[#E8EDFA] text-[13.5px] font-[600] text-heading"
              disabled={update.isPending}
              onClick={() => {
                setDraft(toDraft(invoice))
                setEditing(false)
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-auto py-[10px] rounded-[10px] text-white text-[13.5px] font-[700] border-0"
              style={{ background: "linear-gradient(135deg,#7AA7FF,#A78BFA)" }}
              disabled={update.isPending || !amountValid}
              onClick={handleSave}
            >
              {update.isPending ? "Saving…" : "Save changes"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="flex-1 h-auto py-[10px] rounded-[10px] border-[#E8EDFA] text-[13.5px] font-[600] text-heading"
              nativeButton={false}
              render={<a href={invoice.gmailLink} target="_blank" rel="noopener noreferrer" />}
            >
              <ExternalLink size={15} strokeWidth={1.5} />
              Open in Gmail
            </Button>
            <Button
              className="flex-1 h-auto py-[10px] rounded-[10px] text-white text-[13.5px] font-[700] border-0"
              style={{ background: "linear-gradient(135deg,#7AA7FF,#A78BFA)" }}
              onClick={() => setEditing(true)}
            >
              Edit fields
            </Button>
          </>
        )}
      </div>
    </SheetContent>
  )
}

// ── Main component ────────────────────────────────────────────────────

type UIState = "data" | "loading" | "empty"

export function InvoicesClient({ invoices }: { invoices: InvoiceRow[] }) {
  const [search, setSearch]       = useState("")
  const [statusFilter, setStatus] = useState<string>("all")
  const [uiState, setUiState]     = useState<UIState>("data")
  const [selected, setSelected]   = useState<InvoiceRow | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return invoices.filter((inv) => {
      const matchSearch =
        !q ||
        (inv.vendorName ?? "").toLowerCase().includes(q) ||
        (inv.invoiceNumber ?? "").toLowerCase().includes(q) ||
        inv.totalAmount.includes(q)
      const matchStatus =
        statusFilter === "all" || inv.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [invoices, search, statusFilter])

  const STATUS_OPTIONS = [
    { value: "all",      label: "Status: All" },
    { value: "DETECTED", label: "Detected" },
    { value: "MATCHED",  label: "Confirmed" },
    { value: "UNMATCHED",label: "Review" },
    { value: "REVIEWED", label: "Reviewed" },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative" style={{ maxWidth: "340px", flex: "1 1 220px" }}>
          <Search size={14} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor, amount, invoice #…"
            className="h-auto pl-[34px] pr-3 py-[8px] text-[13.5px] text-text-primary border-[#E8EDFA] rounded-[10px] bg-background"
          />
        </div>

        {/* Status filter */}
        <Select
          items={STATUS_OPTIONS}
          value={statusFilter}
          onValueChange={(v) => setStatus(v as string)}
        >
          <SelectTrigger className="h-auto py-[8px] rounded-[10px] border-[#E8EDFA] bg-white text-[13px] font-[600] text-text-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* UI state tabs (dev helper) */}
        <div className="flex items-center gap-[3px] bg-white border border-[#E8EDFA] rounded-[9px] p-[3px] ml-auto">
          {(["data", "loading", "empty"] as UIState[]).map((s) => (
            <button
              key={s}
              onClick={() => setUiState(s)}
              className="px-[7px] py-[7px] rounded-[7px] text-[12px] font-[600] capitalize transition-colors"
              style={{
                background: uiState === s ? "#EEF3FF" : "transparent",
                color: uiState === s ? "#3B6FE0" : "#94A3B8",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <span className="text-[13px] font-[500] text-[#94A3B8] shrink-0">
          {filtered.length} detected
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8EDFA] rounded-[14px] overflow-hidden">
        {/* Header */}
        <div
          className="grid px-[18px] py-[12px] bg-[#F8FAFF] border-b border-[#E8EDFA]"
          style={{ gridTemplateColumns: "1.6fr 1fr 0.8fr 0.7fr 1.1fr 0.9fr 40px", gap: "12px" }}
        >
          {["Vendor", "Invoice #", "Amount", "Date", "Confidence", "Status", ""].map((h, i) => (
            <span
              key={i}
              className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-[#64748B]"
              style={i === 2 ? { textAlign: "right" } : undefined}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Body */}
        {uiState === "loading" && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

        {uiState === "empty" && <EmptyState />}

        {uiState === "data" && filtered.length === 0 && (
          <div className="py-12 text-center text-[13.5px] text-[#94A3B8]">
            {invoices.length === 0 ? <EmptyState /> : "No results match your search"}
          </div>
        )}

        {uiState === "data" && filtered.map((inv) => {
          const vendor = inv.vendorName ?? inv.senderName ?? inv.senderEmail
          const status = STATUS_META[inv.status] ?? STATUS_META.DETECTED
          const pct    = Math.round(inv.extractionConfidence * 100)

          return (
            <div
              key={inv.id}
              onClick={() => setSelected(inv)}
              className="grid items-center px-[18px] py-[13px] border-b border-[#F1F3F8] cursor-pointer hover:bg-[#FAFBFF] transition-colors last:border-b-0"
              style={{ gridTemplateColumns: "1.6fr 1fr 0.8fr 0.7fr 1.1fr 0.9fr 40px", gap: "12px" }}
            >
              {/* Vendor */}
              <div className="flex items-center gap-[10px] min-w-0">
                <VendorAvatar vendor={vendor} />
                <span className="text-[13.5px] font-[600] text-[#334155] truncate">{vendor}</span>
              </div>

              {/* Invoice # */}
              <span className="text-[13px] text-[#64748B] font-mono truncate">
                {inv.invoiceNumber ?? "—"}
              </span>

              {/* Amount */}
              <span className="text-[13.5px] font-[700] text-heading text-right">
                {fmtAmount(inv.totalAmount, inv.currency)}
              </span>

              {/* Date */}
              <span className="text-[13px] text-[#64748B]">
                {format(new Date(inv.emailDate), "MMM d")}
              </span>

              {/* Confidence */}
              <div className="flex items-center gap-2">
                <Progress
                  value={pct}
                  className="flex-1 gap-0 **:data-[slot=progress-track]:h-[6px] **:data-[slot=progress-track]:bg-[#F1F3F8] **:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-indicator]:bg-(--conf)"
                  style={{ "--conf": confidenceColor(inv.extractionConfidence) } as React.CSSProperties}
                />
                <span className="text-[12px] font-[600] text-[#64748B] w-[30px] text-right shrink-0">
                  {pct}%
                </span>
              </div>

              {/* Status */}
              <div>
                <StatusBadge status={status} />
              </div>

              {/* Gmail link */}
              <Button
                variant="ghost"
                size="icon-sm"
                title="Open in Gmail"
                className="text-[#94A3B8] hover:bg-[#EFF6FF] hover:text-[#3B6FE0]"
                nativeButton={false}
                render={
                  <a
                    href={inv.gmailLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  />
                }
              >
                <ExternalLink size={14} strokeWidth={1.5} />
              </Button>
            </div>
          )
        })}
      </div>

      {/* Drawer */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        {selected && <InvoiceDrawer key={selected.id} invoice={selected} onSaved={setSelected} />}
      </Sheet>
    </div>
  )
}
