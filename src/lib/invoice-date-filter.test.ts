import assert from "node:assert/strict"
import { test } from "node:test"

import { resolveInvoiceDateRange } from "./invoice-date-filter"

// Fixed reference point: Wed 2026-08-12T14:30, mid-month, mid-year.
const NOW = new Date(2026, 7, 12, 14, 30, 0)

test("all → no bounds (null)", () => {
  assert.equal(resolveInvoiceDateRange({ preset: "all" }, NOW), null)
})

test("thisMonth spans start-of-month through end of today", () => {
  const r = resolveInvoiceDateRange({ preset: "thisMonth" }, NOW)!
  assert.equal(r.from.getTime(), new Date(2026, 7, 1, 0, 0, 0, 0).getTime())
  assert.equal(r.to.getTime(), new Date(2026, 7, 12, 23, 59, 59, 999).getTime())
})

test("lastMonth spans the whole previous calendar month", () => {
  const r = resolveInvoiceDateRange({ preset: "lastMonth" }, NOW)!
  assert.equal(r.from.getTime(), new Date(2026, 6, 1, 0, 0, 0, 0).getTime())
  assert.equal(r.to.getTime(), new Date(2026, 6, 31, 23, 59, 59, 999).getTime())
})

test("ytd starts on Jan 1 of the current year", () => {
  const r = resolveInvoiceDateRange({ preset: "ytd" }, NOW)!
  assert.equal(r.from.getTime(), new Date(2026, 0, 1, 0, 0, 0, 0).getTime())
})

test("year is a trailing 12-month window", () => {
  const r = resolveInvoiceDateRange({ preset: "year" }, NOW)!
  assert.equal(r.from.getTime(), new Date(2025, 7, 12, 0, 0, 0, 0).getTime())
})

test("custom range is inclusive of both endpoints' full days", () => {
  const r = resolveInvoiceDateRange({ from: "2026-03-04", to: "2026-03-09" }, NOW)!
  assert.equal(r.from.getTime(), new Date(2026, 2, 4, 0, 0, 0, 0).getTime())
  assert.equal(r.to.getTime(), new Date(2026, 2, 9, 23, 59, 59, 999).getTime())
})
