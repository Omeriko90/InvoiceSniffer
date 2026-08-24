import assert from "node:assert/strict"
import { test } from "node:test"

import { buildFixedExpenseMatchWhere, matchesExpense, periodTimeline } from "./fixed-expenses"

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

// ── periodTimeline ───────────────────────────────────────────────

// periodTimeline reads these expense fields; match fields are unused here since
// the linked invoices are already attached to the expense.
const timelineExpense = (over: Partial<{ anchorDate: Date; createdAt: Date; frequency: "MONTHLY"; gracePeriodDays: number }>) => ({
  anchorDate: new Date("2026-08-01"),
  createdAt: new Date("2026-08-01"),
  frequency: "MONTHLY" as const,
  gracePeriodDays: 5,
  vendorNormalized: [],
  senderEmail: [],
  gmailCredentialId: null,
  ...over,
})
const linkedOn = (iso: string) => ({
  emailDate: new Date(iso),
  vendorNormalized: null,
  senderEmail: null,
  gmailCredentialId: null,
})

test("periodTimeline surfaces an absorbed invoice older than the expense's creation", () => {
  // Expense created this month, but it absorbed an invoice from six months ago.
  const exp = timelineExpense({})
  const now = new Date("2026-08-24")
  const { entries } = periodTimeline(exp, [linkedOn("2026-02-15")], now)

  // The old code floored at the creation period (one row); now the floor drops
  // to the oldest invoice's period, so its month is included and marked ARRIVED.
  const feb = new Date("2026-02-15").getTime()
  const arrived = entries.find((e) => e.start.getTime() <= feb && feb < e.end.getTime())
  assert.ok(arrived, "expected an entry covering the February invoice")
  assert.equal(arrived!.status, "ARRIVED")
  assert.ok(entries.length >= 7, `expected periods back through February, got ${entries.length}`)
})

test("periodTimeline with no linked invoices still floors at the creation period", () => {
  const exp = timelineExpense({})
  const now = new Date("2026-08-24")
  const { entries, hasMore } = periodTimeline(exp, [], now)
  assert.equal(entries.length, 1, "only the current period when nothing was absorbed")
  assert.equal(entries[0].status, "PENDING") // Aug grace window is still open on the 24th
  assert.equal(hasMore, false)
})
