import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InvoicesClient } from "@/components/invoices/InvoicesClient"
import type { InvoiceRow } from "@/components/invoices/types"
import { INVOICE_ROW_SELECT, toInvoiceRow } from "@/lib/invoice-row"

async function getInvoices(organizationId: string): Promise<InvoiceRow[]> {
  const invoices = await prisma.invoice.findMany({
    // removedAt: null hides soft-deleted invoices (marked "not relevant" / "not an
    // invoice") from every list, filter, search and export fed by this page.
    where: { organizationId, removedAt: null },
    orderBy: { emailDate: "desc" },
    take: 200,
    select: INVOICE_ROW_SELECT,
  })

  return invoices.map(toInvoiceRow)
}

export default async function InvoicesPage() {
  const session = await auth()
  if (!session) return null

  const invoices = await getInvoices(session.user.organizationId)

  return <InvoicesClient invoices={invoices} />
}
