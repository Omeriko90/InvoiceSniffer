import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InvoicesClient } from "@/components/invoices/InvoicesClient"
import type { InvoiceRow } from "@/components/invoices/types"

async function getInvoices(organizationId: string): Promise<InvoiceRow[]> {
  const invoices = await prisma.invoice.findMany({
    where: { organizationId },
    orderBy: { emailDate: "desc" },
    take: 200,
    select: {
      id: true,
      vendorName: true,
      invoiceNumber: true,
      totalAmount: true,
      currency: true,
      emailDate: true,
      invoiceDate: true,
      dueDate: true,
      extractionConfidence: true,
      status: true,
      gmailLink: true,
      senderEmail: true,
      senderName: true,
      subject: true,
      attachmentMeta: true,
      receiptUrl: true,
      gmailCredential: { select: { email: true, label: true } },
    },
  })

  return invoices.map((inv) => ({
    id: inv.id,
    vendorName: inv.vendorName,
    invoiceNumber: inv.invoiceNumber,
    totalAmount: inv.totalAmount.toString(),
    currency: inv.currency,
    emailDate: inv.emailDate.toISOString(),
    invoiceDate: inv.invoiceDate?.toISOString() ?? null,
    dueDate: inv.dueDate?.toISOString() ?? null,
    extractionConfidence: inv.extractionConfidence,
    status: inv.status as InvoiceRow["status"],
    gmailLink: inv.gmailLink,
    senderEmail: inv.senderEmail,
    senderName: inv.senderName,
    subject: inv.subject,
    attachmentMeta: inv.attachmentMeta as InvoiceRow["attachmentMeta"],
    receiptUrl: inv.receiptUrl,
    sourceAccount: inv.gmailCredential
      ? { email: inv.gmailCredential.email, label: inv.gmailCredential.label }
      : null,
  }))
}

export default async function InvoicesPage() {
  const session = await auth()
  if (!session) return null

  const invoices = await getInvoices(session.user.organizationId)

  return <InvoicesClient invoices={invoices} />
}
