// Smoke-test the Gemini *Batch* API end to end — the core of the batch
// classifier (llm-classifier-batch.ts): stage an input.jsonl in GCS, submit a
// batch job, poll to completion, read the predictions JSONL back, and verify the
// verdicts. Validates GCS staging + auth + the JSONL request/response format.
// Does NOT touch Gmail/DB.
//   CLASSIFIER_MODEL=gemini-2.5-flash CLASSIFIER_BATCH_GCS_BUCKET=<bucket> \
//     npx tsx scripts/smoke-batch-classifier.ts
import "dotenv/config"
import { isGeminiModel } from "@/lib/gemini"
import { batchGcsBucket } from "@/lib/gcs"
import type { ClassifierInput } from "@/lib/llm-classifier"
import {
  buildClassifierRequest,
  submitClassifierBatch,
  readClassifierBatch,
  classifierModel,
} from "@/lib/llm-classifier-batch"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const CASES: { key: string; input: ClassifierInput; expectInvoice: boolean }[] = [
  {
    key: "msg-invoice",
    expectInvoice: true,
    input: {
      subject: "חשבונית מס 10432 - תשלום התקבל",
      snippet: "מצורפת חשבונית מס/קבלה עבור הזמנתך על סך 1,240 ₪ כולל מע\"מ.",
      senderEmail: "billing@vendor.co.il",
      attachmentNames: ["invoice_10432.pdf"],
      examples: [],
    },
  },
  {
    key: "msg-marketing",
    expectInvoice: false,
    input: {
      subject: "🔥 Weekend sale — 40% off everything!",
      snippet: "Don't miss our biggest sale of the season. Shop now and save big.",
      senderEmail: "news@shop.example",
      attachmentNames: [],
      examples: [],
    },
  },
]

async function main() {
  const model = process.env.CLASSIFIER_MODEL
  if (!isGeminiModel(model)) {
    console.error("CLASSIFIER_MODEL is unset or not a gemini-* model — set it to run this spike.")
    process.exitCode = 1
    return
  }
  if (!batchGcsBucket()) {
    console.error("CLASSIFIER_BATCH_GCS_BUCKET is unset — set it to a writable GCS bucket to run this spike.")
    process.exitCode = 1
    return
  }

  console.log("── Gemini batch classifier smoke test ─────────────")
  console.log(`model:          ${classifierModel()}`)
  console.log(`GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID ?? "(unset!)"}`)
  console.log(`GCP_REGION:     ${process.env.GCP_REGION ?? "us-central1 (default)"}`)
  console.log(`GCS bucket:     ${batchGcsBucket()}`)

  const requests = CASES.map((c) => buildClassifierRequest(c.input, c.key))
  console.log(`\nStaging + submitting batch of ${requests.length} request(s) …`)
  const { resourceName, state } = await submitClassifierBatch(requests, "smoke-batch-classifier")
  console.log(`submitted:      ${resourceName} (state=${state})`)

  // Poll to completion. Inline batches usually finish within a couple minutes.
  const deadline = Date.now() + 15 * 60 * 1000
  let result = await readClassifierBatch(resourceName)
  while (!result.done) {
    if (Date.now() > deadline) {
      console.error("\n❌ TIMED OUT waiting for the batch to finish (15m).")
      process.exitCode = 1
      return
    }
    console.log(`  state=${result.state} … waiting`)
    await sleep(10_000)
    result = await readClassifierBatch(resourceName)
  }

  console.log(`\nfinal state:    ${result.state}`)
  if (!result.succeeded) {
    console.error("❌ Batch did not succeed — inline requests may be unsupported on Vertex; see header note.")
    process.exitCode = 1
    return
  }

  // Map each verdict back by its echoed key (Vertex does not preserve order).
  let ok = true
  for (const c of CASES) {
    const verdict = result.verdicts.find((x) => x.key === c.key)?.verdict
    const pass = verdict?.isInvoice === c.expectInvoice
    ok &&= pass
    console.log(
      `  ${c.key.padEnd(16)} → ${verdict ? `isInvoice=${verdict.isInvoice} conf=${verdict.confidence.toFixed(2)}` : "NO VERDICT"} ${pass ? "✅" : "❌"}`
    )
  }

  if (ok && result.verdicts.length === CASES.length) {
    console.log("\n✅ SUCCESS — GCS batch round-trip works and verdicts mapped by key.")
  } else {
    console.log("\n⚠️  Batch completed but verdicts were missing or unexpected.")
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error("\n❌ FAILED:", err?.message ?? err)
  console.error(
    "\nCommon causes:\n" +
      "  • ADC not set (run: gcloud auth application-default login)\n" +
      "  • Vertex AI API not enabled / SA lacks roles/aiplatform.user + roles/storage.objectAdmin\n" +
      "  • CLASSIFIER_BATCH_GCS_BUCKET missing/unwritable, or in a different region than GCP_REGION\n" +
      "  • GCP_PROJECT_ID / GCP_REGION unset, or model not available in the region"
  )
  process.exitCode = 1
})
