import assert from "node:assert/strict"
import { test } from "node:test"

import { extractBodyText, type GmailPart } from "./invoice-extract"

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url")

const plainPart = (data: string): GmailPart => ({
  mimeType: "text/plain",
  body: { data: b64(data) },
})

// The bug this guards: some senders (SendGrid/Manychat) put HTML markup in the
// text/plain part. It must come back tag-stripped, not as raw <tags>.
test("strips HTML that arrives inside the text/plain part", () => {
  const html = "<html><body><h1>Invoice</h1><p>Total: $21.00</p></body></html>"
  const out = extractBodyText({ parts: [plainPart(html)] })
  assert.ok(!out.includes("<"), `expected no tags, got: ${out}`)
  assert.match(out, /Invoice/i)
  assert.match(out, /Total: \$21\.00/)
})

test("leaves genuine plain text untouched", () => {
  const text = "Invoice #1203438-15\nTotal: $21.00\nThanks (a < b always)"
  const out = extractBodyText({ parts: [plainPart(text)] })
  assert.equal(out, text)
})

// Whole-message body with no MIME parts, unlabeled but actually HTML.
test("strips HTML from an unlabeled top-level body", () => {
  const html = "<div>Receipt <span>#42</span></div>"
  const out = extractBodyText({ body: { data: b64(html) } })
  assert.ok(!out.includes("<"), `expected no tags, got: ${out}`)
  assert.match(out, /Receipt/)
})
