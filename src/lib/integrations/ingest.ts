import { prisma } from "@/lib/prisma"
import { normalizeVendor } from "@/lib/invoice-detection"
import { categorizeInvoice } from "@/lib/llm-categorizer"
import { linkInvoiceToMatchingFixedExpense } from "@/lib/link-fixed-expense"
import { log } from "@/lib/posthog-server"
import type { IntegrationCredential } from "@prisma/client"
import type { NormalizedInvoice } from "./types"

// Ingest a single document pulled from an accounting platform into the Invoice
// model. This is the API-source analog of the tail of invoice-extract.ts: it
// SKIPS heuristic + vision extraction entirely (the provider already returned
// structured data) but reuses the same categorizer and fixed-expense linker, so
// pulled invoices behave identically to Gmail ones downstream.
//
// Idempotent: upserts on (organizationId, source, externalId) so re-pulls update
// in place instead of duplicating. Best-effort categorize + link never fail the
// pull.
export async function ingestNormalizedInvoice(
  cred: IntegrationCredential,
  doc: NormalizedInvoice
): Promise<{ invoiceId: string }> {
  const vendorNormalized = doc.vendorName ? normalizeVendor(doc.vendorName) : null
  // Invoice keeps three required, Gmail-shaped columns. For API sources we
  // synthesize sensible values: emailDate drives every date sort/index, so fall
  // back to the invoice date (or now); senderEmail is unused for API matching.
  const emailDate = doc.invoiceDate ?? new Date()
  const subject =
    [doc.vendorName, doc.invoiceNumber].filter(Boolean).join(" ").trim() ||
    `${cred.provider} ${doc.externalId}`

  const category = await categorizeInvoice({
    vendorName: doc.vendorName ?? null,
    subject,
    senderEmail: "",
    lineItems: doc.lineItems ?? [],
  }).catch(() => null)

  const shared = {
    integrationCredentialId: cred.id,
    externalRef: doc.externalRef ?? null,
    senderEmail: "",
    senderName: doc.vendorName ?? null,
    subject,
    emailDate,
    vendorName: doc.vendorName ?? null,
    vendorNormalized,
    invoiceNumber: doc.invoiceNumber ?? null,
    allocationNumber: doc.allocationNumber ?? null,
    vendorTaxId: doc.vendorTaxId ?? null,
    documentType: doc.documentType ?? "UNKNOWN",
    invoiceDate: doc.invoiceDate ?? null,
    totalAmount: doc.totalAmount,
    currency: doc.currency,
    taxAmount: doc.taxAmount ?? null,
    lineItems: (doc.lineItems ?? []) as never,
    receiptUrl: doc.receiptUrl ?? null,
    extractionMethod: "API" as const,
    extractionConfidence: 1,
  }

  const invoice = await prisma.invoice.upsert({
    where: {
      organizationId_source_externalId: {
        organizationId: cred.organizationId,
        source: cred.provider,
        externalId: doc.externalId,
      },
    },
    create: {
      organizationId: cred.organizationId,
      source: cred.provider,
      externalId: doc.externalId,
      ...shared,
      // create-only: never overwrite a user's manual category on re-pull.
      ...(category ? { category } : {}),
    },
    update: shared,
    select: {
      id: true,
      organizationId: true,
      fixedExpenseId: true,
      vendorNormalized: true,
      senderEmail: true,
      gmailCredentialId: true,
    },
  })

  try {
    await linkInvoiceToMatchingFixedExpense(invoice)
  } catch (err) {
    log.warn("integration ingest: fixed-expense link failed", {
      provider: cred.provider,
      externalId: doc.externalId,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  return { invoiceId: invoice.id }
}
