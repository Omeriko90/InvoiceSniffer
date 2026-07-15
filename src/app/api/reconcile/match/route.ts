import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rate-limit"
import { loadAliases, loadInvoiceCandidates, type SessionInvoice } from "@/lib/matching-data"
import { matchSession, type SessionRow } from "@/lib/match-session"
import { TRAIL_WINDOW_DAYS, type DateWindow } from "@/lib/matching"
import { DATE_RANGE_PRESETS, resolveDateRange } from "@/lib/date-range"
import type { MatchInvoice, MatchResponse, MatchRow, ReconcileStatus } from "@/api-types/reconcile"
import { z } from "zod"

const requestSchema = z.object({
  dateRange: z.union([
    z.object({ preset: z.enum(DATE_RANGE_PRESETS) }),
    z.object({ from: z.string(), to: z.string() }),
  ]),
  files: z
    .array(
      z.object({
        fileName: z.string().min(1),
        rows: z.array(
          z.object({
            date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "invalid date"),
            merchant: z.string().min(1),
            amount: z.number(),
            currency: z.string().optional(),
          })
        ),
      })
    )
    .min(1),
})

const BAND_STATUS: Record<string, ReconcileStatus> = {
  matched: "MATCHED",
  possible: "POSSIBLE",
  missing: "UNMATCHED",
  ignored: "NO_INVOICE",
}

function toInvoiceDTO(inv: SessionInvoice): MatchInvoice {
  return {
    id: inv.id,
    vendorName: inv.vendorName,
    invoiceNumber: inv.invoiceNumber,
    amount: inv.totalAmount.toString(),
    currency: inv.currency,
    date: inv.effectiveDate.toISOString(),
    dueDate: inv.dueDate?.toISOString() ?? null,
    senderEmail: inv.senderEmail,
    gmailLink: inv.gmailLink,
    status: inv.status,
    reconciledSourceFile: inv.reconciledSourceFile,
    reconciledAt: inv.reconciledAt?.toISOString() ?? null,
  }
}

// Stateless per-session matcher: match the uploaded CSV rows against the org's
// invoices (scoped to the chosen date range) entirely in memory. Writes nothing.
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 401 })
  const { organizationId } = session.user

  // Each call loads all in-range invoices and scores every row×invoice pair; cap
  // to 20/min per org to bound CPU/DB from repeated large sessions.
  const limited = await enforceRateLimit(`reconcile:${organizationId}`, 20, 60_000)
  if (limited) return limited

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: z.treeifyError(parsed.error) }, { status: 400 })
  }
  const { dateRange, files } = parsed.data

  const rows: SessionRow[] = files.flatMap((file, fileIdx) =>
    file.rows.map((row, rowIdx) => ({
      id: `${fileIdx}-${rowIdx}`,
      date: new Date(row.date),
      merchant: row.merchant,
      amount: row.amount,
      // Empty = unknown currency; the scorer skips the currency gate rather than
      // wrongly assuming USD for CSVs without a currency column.
      currency: row.currency ?? "",
      sourceFile: file.fileName,
    }))
  )
  // Guard total work the same way the old import route capped rows.
  if (rows.length > 10_000) {
    return Response.json({ error: "Too many rows (max 10,000 per session)" }, { status: 400 })
  }

  const range = resolveDateRange(dateRange, new Date())
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settlementLagDays: true },
  })
  const leadDays = org?.settlementLagDays ?? 30
  const window: DateWindow = { leadDays, trailDays: TRAIL_WINDOW_DAYS }

  const [invoices, aliases] = await Promise.all([
    // Widen the candidate lower bound by the settlement lag so invoices that
    // precede in-range charges are loaded too.
    loadInvoiceCandidates(organizationId, range, leadDays),
    loadAliases(organizationId),
  ])

  const { results, unreconciledInvoices, summary } = matchSession(rows, invoices, aliases, window)

  const rowDTOs: MatchRow[] = results.map((r) => ({
    id: r.row.id,
    date: r.row.date.toISOString(),
    merchant: r.row.merchant,
    amount: r.row.amount.toString(),
    currency: r.row.currency,
    status: BAND_STATUS[r.band],
    matchConfidence: r.score,
    matchReason: r.reason,
    matchConfirmed: false,
    sourceFile: r.row.sourceFile,
    collision: r.collision,
    invoice: r.invoice ? toInvoiceDTO(r.invoice) : null,
  }))

  const response: MatchResponse = {
    results: rowDTOs,
    unreconciledInvoices: unreconciledInvoices.map(toInvoiceDTO),
    summary,
  }
  return Response.json(response)
}
