import { JobState } from "@google/genai"
import { prisma } from "@/lib/prisma"
import { log } from "@/lib/posthog-server"
import { readClassifierBatch } from "@/lib/llm-classifier-batch"
import { deleteUnder } from "@/lib/gcs"
import { enqueueExtraction, incrementIgnoreRuleUseCount } from "./gmail-sync"
import type { ClassificationBatch, PendingClassification } from "@prisma/client"

// Phase 2 of the batch classifier (see llm-classifier-batch.ts): poll the
// Gemini batch jobs a Gmail sync submitted, apply each verdict, enqueue the
// resulting extractions, and delete the waiting-list rows. Invoked by
// src/workers/run-batch.ts under MODE=classify-consume (mirrors export-build.ts).

// A batch stuck in-flight past this is treated as expired → fail-open. The
// Vertex batch SLA is <24h; the extra slack covers a late-running job.
const STALE_AFTER_MS = 26 * 60 * 60 * 1000

type BatchWithItems = ClassificationBatch & { items: PendingClassification[] }

// Poll all in-flight batches. Returns how many were examined. Each batch is
// isolated so one poll/apply failure doesn't abort the rest of the run.
export async function processPendingClassifications(): Promise<number> {
  const batches = await prisma.classificationBatch.findMany({
    where: { state: { in: ["QUEUED", "RUNNING"] }, resourceName: { not: null } },
    include: { items: true },
  })

  for (const batch of batches) {
    try {
      await processBatch(batch)
    } catch (err) {
      log.error("classify-consume: batch poll failed", { batchId: batch.id, err: String(err) })
    }
  }

  return batches.length
}

async function processBatch(batch: BatchWithItems): Promise<void> {
  const result = await readClassifierBatch(batch.resourceName!)

  if (!result.done) {
    const ageMs = Date.now() - batch.createdAt.getTime()
    if (ageMs >= STALE_AFTER_MS) {
      log.warn("classify-consume: batch stale, failing open", { batchId: batch.id, ageMs })
      await failOpen(batch)
      await deleteBatch(batch.id, result.artifactPrefix)
      return
    }
    // Still running — record the transition to RUNNING and check again next tick.
    if (result.state === JobState.JOB_STATE_RUNNING && batch.state !== "RUNNING") {
      await prisma.classificationBatch.update({ where: { id: batch.id }, data: { state: "RUNNING" } })
    }
    return
  }

  if (!result.succeeded) {
    log.warn("classify-consume: batch failed, failing open", { batchId: batch.id, state: result.state })
    await failOpen(batch)
    await deleteBatch(batch.id, result.artifactPrefix)
    return
  }

  // Map each verdict back to its item by echoed key (gmailMessageId). A
  // missing/null verdict fails that item open to the heuristic.
  for (const item of batch.items) {
    const v = result.verdicts.find((x) => x.key === item.gmailMessageId)
    const isCandidate = v?.verdict ? v.verdict.isInvoice : item.heuristicIsCandidate
    await applyItem(item, isCandidate)
  }
  await deleteBatch(batch.id, result.artifactPrefix)
}

// Delete the waiting-list row (cascades to items) and best-effort-remove the
// batch's staged GCS objects. A bucket lifecycle rule is the safety net if this
// GCS delete ever fails.
async function deleteBatch(batchId: string, artifactPrefix: string | undefined): Promise<void> {
  await prisma.classificationBatch.delete({ where: { id: batchId } })
  if (artifactPrefix) {
    try {
      await deleteUnder(artifactPrefix)
    } catch (err) {
      log.warn("classify-consume: GCS artifact cleanup failed (lifecycle rule will reap)", {
        batchId,
        artifactPrefix,
        err: String(err),
      })
    }
  }
}

// Apply the resolved candidacy for one item: enqueue extraction if it's an
// invoice, and reproduce the deferred "learned rule worked" useCount flip
// (penalty pushed a would-be candidate below the threshold).
async function applyItem(item: PendingClassification, isCandidate: boolean): Promise<void> {
  if (isCandidate) {
    await enqueueExtraction(item.organizationId, item.credentialId, item.gmailMessageId)
  }
  if (item.hadPenalty && item.rawIsCandidate && !isCandidate) {
    await incrementIgnoreRuleUseCount(item.organizationId, item.senderEmail)
  }
}

async function failOpen(batch: BatchWithItems): Promise<void> {
  for (const item of batch.items) {
    await applyItem(item, item.heuristicIsCandidate)
  }
}
