import assert from "node:assert/strict"
import { test } from "node:test"
import { PDFDocument } from "pdf-lib"

import { renderBodyInvoicePdf, type BodyInvoiceMeta } from "./html-invoice-pdf"

const meta = (over: Partial<BodyInvoiceMeta> = {}): BodyInvoiceMeta => ({
  vendorName: "Apple",
  invoiceNumber: "708160214575",
  invoiceDate: new Date("2026-07-11T00:00:00Z"),
  dueDate: null,
  totalAmount: 49.9,
  currency: "ILS",
  taxAmount: null,
  ...over,
})

test("renders a valid, loadable PDF", async () => {
  const bytes = await renderBodyInvoicePdf("Receipt\nOrder ID: MQFHD53N9M", meta())
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-")
  const doc = await PDFDocument.load(bytes)
  assert.ok(doc.getPageCount() >= 1)
})

// The Apple/Google receipts this feature targets are Israeli — the body mixes
// English with Hebrew and the ₪ symbol. The embedded Heebo font + bidi layout
// must render (and reorder) these without throwing.
test("does not throw on Hebrew + currency symbols", async () => {
  const body = "Billing\n5230205 רמת גן ישראל\nMasterCard •••• 1291\n₪49.90"
  const bytes = await renderBodyInvoicePdf(body, meta())
  assert.ok(bytes.byteLength > 0)
})

test("paginates a long body across multiple pages", async () => {
  const body = Array.from({ length: 400 }, (_, i) => `Line ${i} of the receipt body`).join("\n")
  const bytes = await renderBodyInvoicePdf(body, meta())
  const doc = await PDFDocument.load(bytes)
  assert.ok(doc.getPageCount() > 1)
})

test("still renders when every metadata field is empty", async () => {
  const bytes = await renderBodyInvoicePdf("some content", {
    vendorName: null,
    invoiceNumber: null,
    invoiceDate: null,
    dueDate: null,
    totalAmount: 0,
    currency: "",
    taxAmount: null,
  })
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-")
})
