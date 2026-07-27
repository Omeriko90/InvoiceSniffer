import assert from "node:assert/strict"
import { test } from "node:test"
import type { Job } from "bullmq"

import { isRepeatablePlaceholder, pendingWorkCount } from "./drain-idle"

// Minimal stand-ins for the two Job fields the drain logic inspects.
const job = (fields: Partial<Pick<Job, "id" | "opts">>): Pick<Job, "id" | "opts"> => ({
  id: fields.id,
  opts: fields.opts ?? {},
})

const repeatById = job({ id: "repeat:daily-gmail-sync:1785207600000" })
const repeatByOpts = job({ id: "abc", opts: { repeat: { pattern: "0 3 * * *" } } as Job["opts"] })
const retryJob = job({ id: "sync-cred123", opts: {} })

test("isRepeatablePlaceholder detects the daily schedule by id prefix", () => {
  assert.equal(isRepeatablePlaceholder(repeatById), true)
})

test("isRepeatablePlaceholder detects a job carrying a repeat option", () => {
  assert.equal(isRepeatablePlaceholder(repeatByOpts), true)
})

test("isRepeatablePlaceholder treats a normal retry job as real work", () => {
  assert.equal(isRepeatablePlaceholder(retryJob), false)
})

test("regression: a lone repeatable placeholder must read as idle (0 pending)", () => {
  // The exact production state that wedged the drain: nothing waiting/active,
  // one delayed entry that is the daily schedule. Must be 0, or the worker never
  // exits and times out at MAX_RUNTIME.
  const count = pendingWorkCount({ waiting: 0, active: 0, delayed: 1 }, [repeatById])
  assert.equal(count, 0)
})

test("a delayed retry job still counts as pending work", () => {
  const count = pendingWorkCount({ waiting: 0, active: 0, delayed: 1 }, [retryJob])
  assert.equal(count, 1)
})

test("mixed delayed set counts only the non-repeatable jobs", () => {
  // 3 delayed: 1 daily schedule + 2 genuine retries → 2 pending.
  const count = pendingWorkCount({ waiting: 0, active: 0, delayed: 3 }, [
    repeatById,
    retryJob,
    job({ id: "sync-cred456" }),
  ])
  assert.equal(count, 2)
})

test("waiting and active always count regardless of delayed", () => {
  const count = pendingWorkCount({ waiting: 2, active: 1, delayed: 1 }, [repeatById])
  assert.equal(count, 3)
})

test("empty queue reads as idle", () => {
  assert.equal(pendingWorkCount({}, []), 0)
})
