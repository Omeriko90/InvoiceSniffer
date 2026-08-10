import assert from "node:assert/strict"
import { test } from "node:test"

import { buildFixedExpenseMatchWhere, matchesExpense } from "./fixed-expenses"

// matchesExpense only reads these three fields off each side.
const invoice = (over: Partial<{ vendorNormalized: string | null; senderEmail: string | null; gmailCredentialId: string | null }>) => ({
  vendorNormalized: null,
  senderEmail: null,
  gmailCredentialId: null,
  ...over,
})
const expense = (over: Partial<{ vendorNormalized: string[]; senderEmail: string[]; gmailCredentialId: string | null }>) => ({
  vendorNormalized: [],
  senderEmail: [],
  gmailCredentialId: null,
  ...over,
})

// ── matchesExpense ───────────────────────────────────────────────

test("shared sender + a DIFFERENT known vendor → no match (the iCount bug)", () => {
  const inv = invoice({ vendorNormalized: "vendor b", senderEmail: "invoices@icount.co" })
  const exp = expense({ vendorNormalized: ["vendor a"], senderEmail: ["invoices@icount.co"] })
  assert.equal(matchesExpense(inv, exp), false)
})

test("same vendor, brand-new sender address → still matches (vendor moved mailbox)", () => {
  const inv = invoice({ vendorNormalized: "vendor a", senderEmail: "new@vendora.com" })
  const exp = expense({ vendorNormalized: ["vendor a"], senderEmail: ["old@vendora.com"] })
  assert.equal(matchesExpense(inv, exp), true)
})

test("exact vendor + sender match → matches", () => {
  const inv = invoice({ vendorNormalized: "vendor a", senderEmail: "billing@vendora.com" })
  const exp = expense({ vendorNormalized: ["vendor a"], senderEmail: ["billing@vendora.com"] })
  assert.equal(matchesExpense(inv, exp), true)
})

test("sender is matched case-insensitively", () => {
  const inv = invoice({ vendorNormalized: "vendor a", senderEmail: "Billing@Vendora.com" })
  const exp = expense({ vendorNormalized: ["vendor a"], senderEmail: ["billing@vendora.com"] })
  assert.equal(matchesExpense(inv, exp), true)
})

test("sender-only expense + invoice with no extracted vendor → sender match wins", () => {
  const inv = invoice({ vendorNormalized: null, senderEmail: "invoices@icount.co" })
  const exp = expense({ vendorNormalized: [], senderEmail: ["invoices@icount.co"] })
  assert.equal(matchesExpense(inv, exp), true)
})

test("known-vendor expense + shared sender + BLANK invoice vendor → falls back to sender", () => {
  // No vendor signal on the invoice means nothing to contradict, so the sender
  // hit is trusted — the deliberately-accepted residual ambiguity.
  const inv = invoice({ vendorNormalized: null, senderEmail: "invoices@icount.co" })
  const exp = expense({ vendorNormalized: ["vendor a"], senderEmail: ["invoices@icount.co"] })
  assert.equal(matchesExpense(inv, exp), true)
})

test("pinned mailbox mismatch → never matches, even on vendor+sender", () => {
  const inv = invoice({ vendorNormalized: "vendor a", senderEmail: "billing@vendora.com", gmailCredentialId: "mbox-2" })
  const exp = expense({ vendorNormalized: ["vendor a"], senderEmail: ["billing@vendora.com"], gmailCredentialId: "mbox-1" })
  assert.equal(matchesExpense(inv, exp), false)
})

// ── buildFixedExpenseMatchWhere (SQL twin) ───────────────────────

test("no signals → null (nothing to match)", () => {
  assert.equal(buildFixedExpenseMatchWhere({ vendorNormalized: [], senderEmail: [] }), null)
})

test("sender-only → plain OR of case-insensitive sender conditions, no vendor guard", () => {
  const where = buildFixedExpenseMatchWhere({ vendorNormalized: [], senderEmail: ["a@x.co", "b@x.co"] })
  assert.deepEqual(where, {
    OR: [
      { senderEmail: { equals: "a@x.co", mode: "insensitive" } },
      { senderEmail: { equals: "b@x.co", mode: "insensitive" } },
    ],
  })
})

test("vendor-only → bare vendor `in` condition", () => {
  const where = buildFixedExpenseMatchWhere({ vendorNormalized: ["vendor a"], senderEmail: [] })
  assert.deepEqual(where, { vendorNormalized: { in: ["vendor a"] } })
})

test("vendor + sender → sender branch is guarded against a conflicting known vendor", () => {
  const where = buildFixedExpenseMatchWhere({ vendorNormalized: ["vendor a"], senderEmail: ["invoices@icount.co"] })
  assert.deepEqual(where, {
    OR: [
      { vendorNormalized: { in: ["vendor a"] } },
      {
        AND: [
          { OR: [{ senderEmail: { equals: "invoices@icount.co", mode: "insensitive" } }] },
          { OR: [{ vendorNormalized: null }, { vendorNormalized: "" }, { vendorNormalized: { in: ["vendor a"] } }] },
        ],
      },
    ],
  })
})
