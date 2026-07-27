import type { Job } from "bullmq"

// A repeatable job (e.g. the daily sync schedule) permanently parks one entry in
// the `delayed` set representing its NEXT occurrence. That placeholder is a
// schedule, not pending work — its id is prefixed `repeat:` and/or it carries a
// `repeat` option. A drain that counted it would never go idle and would always
// run to the MAX_RUNTIME timeout.
export function isRepeatablePlaceholder(job: Pick<Job, "id" | "opts">): boolean {
  return Boolean(job.id?.startsWith("repeat:") || job.opts?.repeat)
}

// How many jobs in a queue represent actual pending work? `waiting` and `active`
// always count. `delayed` counts too — retry-backoff jobs live there — EXCEPT
// repeatable schedule placeholders, which are excluded. Pure so the drain's
// idle detection can be unit-tested without a live Redis.
export function pendingWorkCount(
  counts: { waiting?: number; active?: number; delayed?: number },
  delayedJobs: Array<Pick<Job, "id" | "opts">>,
): number {
  const waiting = counts.waiting ?? 0
  const active = counts.active ?? 0
  const delayed = counts.delayed ?? 0
  const scheduled = delayedJobs.filter(isRepeatablePlaceholder).length
  return waiting + active + (delayed - scheduled)
}
