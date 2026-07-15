import { auth } from "@/lib/auth"
import { loadInvoicesInRange } from "@/lib/export-data"
import { resolveDateRange } from "@/lib/date-range"
import { NextRequest, NextResponse } from "next/server"

// GET /api/invoices/export-preview?from=<iso>&to=<iso>
// Lists invoices whose effective date falls in the range, for the export dialog's
// selectable list. Fetched fresh so ranges that exceed / predate the 200 rows
// pre-loaded on the invoices page still resolve correctly.
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const from = req.nextUrl.searchParams.get("from")
  const to = req.nextUrl.searchParams.get("to")
  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 })
  }

  const range = resolveDateRange({ from, to }, new Date())
  const invoices = await loadInvoicesInRange(session.user.organizationId, range)

  return NextResponse.json({
    invoices: invoices.map((inv) => ({
      id: inv.id,
      vendorName: inv.vendorName,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      totalAmount: inv.totalAmount,
      currency: inv.currency,
      taxAmount: inv.taxAmount,
    })),
  })
}
