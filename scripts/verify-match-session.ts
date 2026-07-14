/**
 * Standalone check for the pure session matcher — no DB, no framework.
 * Run: npx tsx scripts/verify-match-session.ts
 * (The repo has no test runner; this mirrors the existing tsx debug-script pattern.)
 */
import { matchSession, type SessionRow } from "@/lib/match-session"
import type { AliasRow, SessionInvoice } from "@/lib/matching-data"

let failures = 0
function check(label: string, cond: boolean) {
  if (!cond) {
    failures++
    console.error(`  ✘ ${label}`)
  } else {
    console.log(`  ✓ ${label}`)
  }
}

const day = (s: string) => new Date(`${s}T00:00:00Z`)

const base = { dueDate: null, senderEmail: "billing@example.com", gmailLink: "https://mail" }
const invoices: SessionInvoice[] = [
  { id: "inv-aws", vendorName: "AWS", invoiceNumber: "A1", totalAmount: 100, currency: "USD", effectiveDate: day("2026-05-02"), status: "DETECTED", reconciledSourceFile: null, reconciledAt: null, ...base },
  { id: "inv-linear", vendorName: "Linear", invoiceNumber: "L1", totalAmount: 50, currency: "USD", effectiveDate: day("2026-05-10"), status: "DETECTED", reconciledSourceFile: null, reconciledAt: null, ...base },
  { id: "inv-openai", vendorName: "OpenAI", invoiceNumber: "O1", totalAmount: 200, currency: "USD", effectiveDate: day("2026-05-15"), status: "MATCHED", reconciledSourceFile: "april.csv", reconciledAt: day("2026-05-20"), ...base },
]

const rows: SessionRow[] = [
  { id: "r1", date: day("2026-05-02"), merchant: "AWS EMEA", amount: 100, currency: "USD", sourceFile: "visa.csv" },
  { id: "r2", date: day("2026-05-15"), merchant: "OPENAI *CHATGPT", amount: 200, currency: "USD", sourceFile: "visa.csv" },
  { id: "r3", date: day("2026-05-01"), merchant: "SOME RANDOM SHOP", amount: 999, currency: "USD", sourceFile: "amex.csv" },
  { id: "r4", date: day("2026-05-03"), merchant: "STARBUCKS", amount: 6, currency: "USD", sourceFile: "amex.csv" },
]

// r4's merchant matches a learned no-invoice (IGNORE) rule.
const aliases: AliasRow[] = [{ merchantPattern: "starbucks", vendorName: "starbucks", type: "IGNORE" }]

const { results, unreconciledInvoices, summary } = matchSession(rows, invoices, aliases)
const byRow = Object.fromEntries(results.map((r) => [r.row.id, r]))

console.log("matchSession:")
check("r1 (AWS exact) → matched on inv-aws", byRow.r1.band === "matched" && byRow.r1.invoice?.id === "inv-aws")
check("r1 not a collision (invoice was open)", byRow.r1.collision === false)
check("r2 (OpenAI) → matched on inv-openai", byRow.r2.band === "matched" && byRow.r2.invoice?.id === "inv-openai")
check("r2 flagged as COLLISION (invoice already reconciled)", byRow.r2.collision === true)
check("r2 carries prior provenance", byRow.r2.invoice?.reconciledSourceFile === "april.csv")
check("r3 (no candidate) → missing", byRow.r3.band === "missing" && byRow.r3.invoice === null)
check("r4 (IGNORE alias) → ignored", byRow.r4.band === "ignored")
check("unreconciled = [inv-linear] only (AWS taken, OpenAI already matched)", unreconciledInvoices.length === 1 && unreconciledInvoices[0].id === "inv-linear")
check("summary.matched === 2", summary.matched === 2)
check("summary.chargesMissingInvoice === 1", summary.chargesMissingInvoice === 1)
check("summary.invoicesMissingCharge === 1", summary.invoicesMissingCharge === 1)
check("summary.collisions === 1", summary.collisions === 1)

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log("\nAll checks passed.")
