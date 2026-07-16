"use client"

import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchMatch, reconcileAction } from "@/api/reconcile"
import { resolveDateRange } from "@/lib/date-range"
import { DateRangeBar } from "@/components/reconcile/DateRangeBar"
import { AddFilesPanel } from "@/components/reconcile/AddFilesPanel"
import { ReconcileSummary } from "@/components/reconcile/ReconcileSummary"
import { UnreconciledInvoicesPanel } from "@/components/reconcile/UnreconciledInvoicesPanel"
import { TabBar } from "@/components/reconcile/TabBar"
import { ReconcileTable } from "@/components/reconcile/ReconcileTable"
import { MatchDrawer } from "@/components/reconcile/MatchDrawer"
import { FindInvoiceModal } from "@/components/reconcile/FindInvoiceModal"
import { TAB_FOR_STATUS } from "@/components/reconcile/constants"
import type { RunAction, TabId, TransactionRow } from "@/components/reconcile/types"
import type {
  CandidateResult,
  DateRangeScope,
  MatchInvoice,
  MatchResponse,
  MatchRow,
  ReconcileAction,
  SessionFileInput,
} from "@/api-types/reconcile"

const ACTION_MSG: Record<string, string> = {
  confirm: "Match confirmed",
  reject: "Match rejected — alias learned",
  no_invoice: "Marked as no invoice needed",
  undo: "Reverted",
  link: "Invoice linked — alias learned",
}

function candidateToInvoice(c: CandidateResult): MatchInvoice {
  return {
    id: c.invoiceId,
    vendorName: c.vendorName,
    invoiceNumber: c.invoiceNumber,
    amount: c.amount.toString(),
    currency: c.currency,
    date: c.date,
    dueDate: c.dueDate,
    senderEmail: c.senderEmail,
    gmailLink: c.gmailLink,
    status: c.status,
    reconciledSourceFile: null,
    reconciledAt: null,
  }
}

export function ReconcileSession() {
  const [scope, setScope] = useState<DateRangeScope>({ preset: "month" })
  const [files, setFiles] = useState<SessionFileInput[]>([])
  const [result, setResult] = useState<MatchResponse | null>(null)
  const [rows, setRows] = useState<MatchRow[]>([])
  const [activeRange, setActiveRange] = useState<{ from: string; to: string }>({ from: "", to: "" })
  const originals = useRef<Map<string, MatchRow>>(new Map())

  const [tab, setTab] = useState<TabId>("all")
  const [detailFor, setDetailFor] = useState<TransactionRow | null>(null)
  const [findFor, setFindFor] = useState<TransactionRow | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [reconciling, setReconciling] = useState(false)

  const phase = result ? "results" : "collect"

  async function runMatch() {
    const range = resolveDateRange(scope, new Date())
    const iso = { from: range.from.toISOString(), to: range.to.toISOString() }
    setReconciling(true)
    try {
      const res = await fetchMatch({ dateRange: iso, files })
      originals.current = new Map(res.results.map((r) => [r.id, r]))
      setResult(res)
      setRows(res.results)
      setActiveRange(iso)
      setTab("all")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setReconciling(false)
    }
  }

  function patchRow(id: string, next: (row: MatchRow) => MatchRow) {
    setRows((prev) => prev.map((r) => (r.id === id ? next(r) : r)))
  }

  async function persist(payload: ReconcileAction, msgKey: string) {
    try {
      await reconcileAction(payload)
      toast.success(ACTION_MSG[msgKey])
    } catch (e) {
      toast.error((e as Error).message)
      throw e
    }
  }

  async function runAction(id: string, action: RunAction) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    setPendingId(id)
    try {
      if (action === "confirm") {
        if (!row.invoice) return
        await persist(
          { action: "confirm", merchant: row.merchant, invoiceId: row.invoice.id, sourceFile: row.sourceFile ?? undefined },
          "confirm"
        )
        patchRow(id, (r) => ({ ...r, status: "MATCHED", matchConfirmed: true }))
      } else if (action === "reject") {
        if (!row.invoice) return
        await persist({ action: "reject", merchant: row.merchant, invoiceId: row.invoice.id }, "reject")
        patchRow(id, (r) => ({
          ...r,
          status: "UNMATCHED",
          invoice: null,
          collision: false,
          matchConfidence: null,
          matchConfirmed: false,
          matchReason: "You rejected the suggested match",
        }))
      } else if (action === "no_invoice") {
        await persist({ action: "no_invoice", merchant: row.merchant }, "no_invoice")
        patchRow(id, (r) => ({
          ...r,
          status: "NO_INVOICE",
          invoice: null,
          collision: false,
          matchConfidence: null,
          matchConfirmed: false,
          matchReason: "You marked this — won’t be flagged",
        }))
      } else if (action === "undo") {
        const orig = originals.current.get(id)
        await persist(
          {
            action: "undo",
            merchant: row.merchant,
            invoiceId: orig?.invoice?.id,
            previousInvoiceStatus: orig?.invoice?.status,
          },
          "undo"
        )
        if (orig) patchRow(id, () => ({ ...orig }))
      }
    } catch {
      // toast already shown; leave row unchanged
    } finally {
      setPendingId(null)
    }
  }

  async function linkInvoice(candidate: CandidateResult) {
    const row = findFor
    if (!row) return
    setPendingId(row.id)
    try {
      await persist(
        { action: "link", merchant: row.merchant, invoiceId: candidate.invoiceId, sourceFile: row.sourceFile ?? undefined },
        "link"
      )
      patchRow(row.id, (r) => ({
        ...r,
        status: "MATCHED",
        matchConfirmed: true,
        matchConfidence: candidate.confidence ?? 1,
        matchReason: "Linked by you — alias learned",
        collision: candidate.status === "MATCHED",
        invoice: candidateToInvoice(candidate),
      }))
      setFindFor(null)
    } catch {
      // toast already shown
    } finally {
      setPendingId(null)
    }
  }

  const tabs = useMemo(() => {
    const byTab = (t: TabId) => rows.filter((r) => TAB_FOR_STATUS[r.status] === t).length
    const list: { id: TabId; label: string; count: number }[] = [
      { id: "all", label: "All", count: rows.length },
      { id: "matched", label: "Matched", count: byTab("matched") },
      { id: "possible", label: "Possible", count: byTab("possible") },
      { id: "missing", label: "Missing invoice", count: byTab("missing") },
      { id: "none", label: "No invoice", count: byTab("none") },
      { id: "invoices", label: "Invoices w/o charge", count: result?.unreconciledInvoices.length ?? 0 },
    ]
    const collisions = rows.filter((r) => r.collision).length
    if (collisions > 0) list.push({ id: "collisions", label: "Already reconciled", count: collisions })
    return list
  }, [rows, result])

  const filtered = useMemo(() => {
    if (tab === "all") return rows
    if (tab === "collisions") return rows.filter((r) => r.collision)
    return rows.filter((r) => TAB_FOR_STATUS[r.status] === tab)
  }, [rows, tab])

  const detailTxn = detailFor ? rows.find((r) => r.id === detailFor.id) ?? null : null

  if (phase === "collect") {
    return (
      <div className="flex flex-col gap-[16px] mx-auto">
        <DateRangeBar scope={scope} onChange={setScope} />
        <AddFilesPanel
          files={files}
          onAddFile={(f) => setFiles((prev) => [...prev, f])}
          onRemoveFile={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
          onReconcile={runMatch}
          reconciling={reconciling}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-[13px]"
          onClick={() => setResult(null)}
        >
          <ArrowLeft size={14} />
          Files &amp; date range
        </Button>
        <Button
          size="sm"
          className="text-[13px]"
          variant="outline"
          disabled={reconciling}
          onClick={runMatch}
        >
          {reconciling ? "Re-running…" : "Re-run match"}
        </Button>
      </div>

      {result && <ReconcileSummary summary={result.summary} />}

      <TabBar tabs={tabs} tab={tab} onSelect={setTab} />

      {tab === "invoices" ? (
        <UnreconciledInvoicesPanel invoices={result?.unreconciledInvoices ?? []} />
      ) : (
        <ReconcileTable
          transactions={rows}
          filtered={filtered}
          pending={(id) => pendingId === id}
          onOpen={setDetailFor}
          onFind={setFindFor}
          onRun={runAction}
        />
      )}

      <MatchDrawer
        transaction={detailTxn}
        onClose={() => setDetailFor(null)}
        onRun={runAction}
        onFind={(txn) => {
          setDetailFor(null)
          setFindFor(txn)
        }}
        pending={pendingId !== null}
      />

      <FindInvoiceModal
        transaction={findFor}
        range={activeRange}
        linking={pendingId !== null}
        onLink={linkInvoice}
        onClose={() => setFindFor(null)}
      />
    </div>
  )
}
