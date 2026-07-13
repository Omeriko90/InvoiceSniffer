import { Worker, Job } from "bullmq"
import { type MatchingJobData } from "@/lib/queues"
import { runMatching } from "@/lib/run-matching"

const connection = { url: process.env.REDIS_URL! }

// Runs reconciliation matching for an org off the request path. Enqueued after a
// CSV import (see src/app/api/import/route.ts) so a large first import doesn't
// block/time-out the HTTP request on the O(n·m) scan.
export function createMatchingWorker() {
  return new Worker<MatchingJobData>(
    "matching",
    async (job: Job<MatchingJobData>) => {
      const { organizationId } = job.data
      return runMatching(organizationId)
    },
    { connection, concurrency: 2 },
  )
}
