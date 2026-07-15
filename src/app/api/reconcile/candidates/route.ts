import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { aliasSignalFor, loadAliases, loadInvoiceCandidates } from "@/lib/matching-data"
import { nameSimilarity, scoreCandidate, TRAIL_WINDOW_DAYS, type DateWindow } from "@/lib/matching"
import { resolveDateRange } from "@/lib/date-range"
import { NextResponse } from "next/server"
import type { CandidateResult } from "@/api-types/reconcile"

// Suggestions for the Find Invoice modal. Stateless — the charge is described by
// query params (merchant/amount/date/currency) instead of a persisted txn id,
// and candidates are scoped to the same session date range (from/to). Without a
// query, return the top scored candidates; with ?q=, search all in-range
// invoices by vendor or invoice # so the user can link something the scorer
// would never suggest.
export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user

  const url = new URL(request.url)
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? ""
  const merchant = url.searchParams.get("merchant") ?? ""
  const amount = Number(url.searchParams.get("amount"))
  const dateStr = url.searchParams.get("date")
  const currency = url.searchParams.get("currency") ?? ""
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")

  if (!merchant || Number.isNaN(amount) || !dateStr || !from || !to) {
    return NextResponse.json({ error: "Missing charge parameters" }, { status: 400 })
  }

  const range = resolveDateRange({ from, to }, new Date())
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settlementLagDays: true },
  })
  const leadDays = org?.settlementLagDays ?? 30
  const window: DateWindow = { leadDays, trailDays: TRAIL_WINDOW_DAYS }

  const [invoices, aliases] = await Promise.all([
    loadInvoiceCandidates(organizationId, range, leadDays),
    loadAliases(organizationId),
  ])
  const mapAliases = aliases.filter((a) => a.type !== "IGNORE")

  const charge = { date: new Date(dateStr), amount, currency, merchant }

  const results: CandidateResult[] = invoices
    .filter(
      (inv) =>
        !q ||
        (inv.vendorName ?? "").toLowerCase().includes(q) ||
        (inv.invoiceNumber ?? "").toLowerCase().includes(q)
    )
    .map((inv) => {
      const scored = scoreCandidate(charge, inv, aliasSignalFor(mapAliases, merchant, inv), window)
      return {
        invoiceId: inv.id,
        vendorName: inv.vendorName,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.totalAmount,
        currency: inv.currency,
        date: inv.effectiveDate.toISOString(),
        dueDate: inv.dueDate?.toISOString() ?? null,
        senderEmail: inv.senderEmail,
        gmailLink: inv.gmailLink,
        status: inv.status,
        confidence: scored?.score ?? null,
        reason: scored?.reason ?? "Outside the match window — link manually",
        nameScore: inv.vendorName ? nameSimilarity(merchant, inv.vendorName) : 0,
      }
    })
    .sort((a, b) => (b.confidence ?? b.nameScore * 0.5) - (a.confidence ?? a.nameScore * 0.5))
    .slice(0, q ? 20 : 5)

  return NextResponse.json(results)
}
