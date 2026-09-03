import assert from "node:assert/strict"
import { test } from "node:test"
import { PDFDocument } from "pdf-lib"

import { renderBodyInvoicePdf, parseLineItems, type BodyInvoiceMeta } from "./html-invoice-pdf"

const meta = (over: Partial<BodyInvoiceMeta> = {}): BodyInvoiceMeta => ({
  vendorName: "Apple",
  documentType: "RECEIPT",
  invoiceNumber: "708160214575",
  invoiceDate: new Date("2026-07-11T00:00:00Z"),
  dueDate: null,
  totalAmount: 49.9,
  currency: "ILS",
  taxAmount: null,
  senderEmail: "no_reply@email.apple.com",
  lineItems: [{ description: "iCloud+ 50GB", quantity: 1, price: 49.9 }],
  ...over,
})

test("renders a valid, loadable PDF", async () => {
  const bytes = await renderBodyInvoicePdf(meta())
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-")
  const doc = await PDFDocument.load(bytes)
  assert.ok(doc.getPageCount() >= 1)
})

// The Apple/Google/Manychat receipts this feature targets are often Israeli —
// the vendor and line-item descriptions mix English with Hebrew. The embedded
// Heebo font + bidi layout must render (and reorder) these without throwing.
test("does not throw on Hebrew fields + tax totals", async () => {
  const bytes = await renderBodyInvoicePdf(
    meta({
      vendorName: "ירדן לוין - מאמנת עסקית",
      taxAmount: 7.63,
      lineItems: [{ description: "מנוי חודשי - שירות פרימיום", quantity: 2, price: 21.0 }],
    })
  )
  assert.ok(bytes.byteLength > 0)
})

test("paginates a long line-item table across multiple pages", async () => {
  const lineItems = Array.from({ length: 120 }, (_, i) => ({
    description: `Line item ${i} of the invoice`,
    quantity: i + 1,
    price: 12.5,
  }))
  const bytes = await renderBodyInvoicePdf(meta({ lineItems }))
  const doc = await PDFDocument.load(bytes)
  assert.ok(doc.getPageCount() > 1)
})

// No line items extracted → header + totals only, no table, still a valid doc.
test("renders header + totals only when there are no line items", async () => {
  const bytes = await renderBodyInvoicePdf(meta({ lineItems: [] }))
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-")
  const doc = await PDFDocument.load(bytes)
  assert.ok(doc.getPageCount() >= 1)
})

test("still renders when every metadata field is empty", async () => {
  const bytes = await renderBodyInvoicePdf({
    vendorName: null,
    documentType: "UNKNOWN",
    invoiceNumber: null,
    invoiceDate: null,
    dueDate: null,
    totalAmount: 0,
    currency: "",
    taxAmount: null,
    senderEmail: "",
    lineItems: [],
  })
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-")
})

test("parseLineItems coerces malformed JSON and drops empty rows", () => {
  assert.deepEqual(parseLineItems("not an array"), [])
  assert.deepEqual(parseLineItems(null), [])
  assert.deepEqual(
    parseLineItems([
      { description: "Widget", quantity: 2, price: 5 },
      { description: null, quantity: null, price: null }, // all-null → dropped
      { description: "No numbers", quantity: "x", price: NaN }, // bad types → nulled
      "garbage",
    ]),
    [
      { description: "Widget", quantity: 2, price: 5 },
      { description: "No numbers", quantity: null, price: null },
    ]
  )
})
