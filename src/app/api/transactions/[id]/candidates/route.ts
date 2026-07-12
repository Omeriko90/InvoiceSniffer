import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { aliasSignalFor, loadAliases, loadInvoiceCandidates } from "@/lib/run-matching"
import { nameSimilarity, scoreCandidate } from "@/lib/matching"
import { NextResponse } from "next/server"
import type { CandidateResult } from "@/api-types/reconcile"

// Suggestions for the Find Invoice modal. Without a query, return the top
// scored candidates; with ?q=, search all linkable invoices by vendor or
// invoice # so the user can link something the scorer would never suggest.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user

  const { id } = await params
  const q = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? ""

  const txn = await prisma.transaction.findFirst({ where: { id, organizationId } })
  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [invoices, aliases] = await Promise.all([
    loadInvoiceCandidates(organizationId),
    loadAliases(organizationId),
  ])
  const mapAliases = aliases.filter((a) => a.type !== "IGNORE")

  const txnInput = {
    date: txn.date,
    amount: Number(txn.amount),
    currency: txn.currency,
    merchant: txn.merchant,
  }

  const results: CandidateResult[] = invoices
    .filter(
      (inv) =>
        !q ||
        (inv.vendorName ?? "").toLowerCase().includes(q) ||
        (inv.invoiceNumber ?? "").toLowerCase().includes(q)
    )
    .map((inv) => {
      const scored = scoreCandidate(txnInput, inv, aliasSignalFor(mapAliases, txn.merchant, inv))
      return {
        invoiceId: inv.id,
        vendorName: inv.vendorName,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.totalAmount,
        currency: inv.currency,
        date: inv.effectiveDate.toISOString(),
        confidence: scored?.score ?? null,
        reason: scored?.reason ?? "Outside the match window — link manually",
        nameScore: inv.vendorName ? nameSimilarity(txn.merchant, inv.vendorName) : 0,
      }
    })
    .sort((a, b) => (b.confidence ?? b.nameScore * 0.5) - (a.confidence ?? a.nameScore * 0.5))
    .slice(0, q ? 20 : 5)

  return NextResponse.json(results)
}
