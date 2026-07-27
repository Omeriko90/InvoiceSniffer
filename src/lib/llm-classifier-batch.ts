import { JobState } from "@google/genai"
import { geminiClient } from "@/lib/gemini"
import { log } from "@/lib/posthog-server"
import { batchGcsBucket, putBatchObject, readBatchJsonlUnder } from "@/lib/gcs"
import {
  INSTRUCTIONS,
  RESPONSE_SCHEMA,
  buildPrompt,
  parseVerdict,
  classifierEnabled,
  type ClassifierInput,
  type ClassifierVerdict,
} from "@/lib/llm-classifier"

// Batch variant of the LLM classifier. Instead of one synchronous
// generateContent call per borderline email (llm-classifier.ts), a Gmail sync
// collects all borderline messages and submits them as ONE asynchronous Gemini
// batch job; a later `classify-consume` run polls the job and applies verdicts.
// See src/workers/gmail-sync.ts (submit) and src/workers/run-batch.ts (consume).
//
// Transport: Vertex batch prediction requires a GCS (or BigQuery) URI — it
// rejects inline requests — so we stage an input.jsonl in GCS (gcs.ts) and read
// the predictions Vertex writes back. Prompt, schema and parsing are shared with
// the inline classifier so verdicts don't drift between the two paths.

// Batch mode is on when the classifier is enabled AND a staging bucket is
// configured (CLASSIFIER_BATCH_GCS_BUCKET) — the bucket's presence is the
// switch. Without a bucket, gmail-sync keeps the inline classifier path.
export function batchClassifierEnabled(): boolean {
  return classifierEnabled() && Boolean(batchGcsBucket())
}

// Max requests per batch job. Vertex allows large batches; we chunk so one
// oversized sync still submits (as several jobs) and each input file stays sane.
export const MAX_BATCH_REQUESTS = 1000

// batchClassifierEnabled() guarantees CLASSIFIER_MODEL is a valid gemini model.
export function classifierModel(): string {
  return process.env.CLASSIFIER_MODEL as string
}

// One line of the input JSONL. Vertex Gemini batch wraps each request under
// "request"; the fields mirror the synchronous generateContent call exactly
// (same system instruction, schema, and disabled thinking). `key` is a top-level
// correlation id: Vertex does NOT return predictions in input order, but it
// echoes each input line's fields alongside the response, so we map verdicts
// back by this key rather than by position.
export type ClassifierRequestLine = { key: string; request: Record<string, unknown> }

export function buildClassifierRequest(input: ClassifierInput, key: string): ClassifierRequestLine {
  return {
    key,
    request: {
      contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
      systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
      generationConfig: {
        maxOutputTokens: 256,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        // Disable "thinking" — same reasoning as the inline path: it spends
        // maxOutputTokens on reasoning and can starve the JSON verdict.
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
  }
}

// Submit ONE batch job: write the input JSONL to GCS, then create the job with
// GCS src/dest. Returns the Vertex resource name used to poll it. Throws on
// failure so the caller can fall back to the heuristic threshold.
export async function submitClassifierBatch(
  lines: ClassifierRequestLine[],
  displayName: string
): Promise<{ resourceName: string; state: JobState | undefined }> {
  // Unique staging path. Date.now()/Math.random() are fine in a worker.
  const batchId = `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`
  const base = `classifier-batches/${batchId}`
  const jsonl = lines.map((l) => JSON.stringify(l)).join("\n")

  const inputUri = await putBatchObject(`${base}/input.jsonl`, jsonl)
  const outputPrefix = `gs://${batchGcsBucket()}/${base}/output/`

  const job = await geminiClient().batches.create({
    model: classifierModel(),
    src: inputUri,
    config: { displayName, dest: outputPrefix },
  })
  if (!job.name) throw new Error("batches.create returned no resource name")
  return { resourceName: job.name, state: job.state }
}

export type BatchVerdict = { index: number; key: string | undefined; verdict: ClassifierVerdict | null }

export type BatchReadResult = {
  state: JobState | undefined
  done: boolean // reached a terminal state (succeeded/failed/cancelled/expired)
  succeeded: boolean // SUCCEEDED or PARTIALLY_SUCCEEDED — verdicts are usable
  verdicts: BatchVerdict[] // populated when succeeded; verdict is null on per-item error
  artifactPrefix?: string // gs:// prefix of this batch's input+output, for cleanup
}

const TERMINAL_STATES: ReadonlySet<JobState> = new Set([
  JobState.JOB_STATE_SUCCEEDED,
  JobState.JOB_STATE_PARTIALLY_SUCCEEDED,
  JobState.JOB_STATE_FAILED,
  JobState.JOB_STATE_CANCELLED,
  JobState.JOB_STATE_EXPIRED,
])

const SUCCESS_STATES: ReadonlySet<JobState> = new Set([
  JobState.JOB_STATE_SUCCEEDED,
  JobState.JOB_STATE_PARTIALLY_SUCCEEDED,
])

// Poll one batch job. When succeeded, downloads the predictions JSONL and maps
// each line back to its request by the echoed `key` (Vertex does not preserve
// input order). A per-row error (or unparseable output) yields verdict=null so
// that item fails open to the heuristic.
export async function readClassifierBatch(resourceName: string): Promise<BatchReadResult> {
  const job = await geminiClient().batches.get({ name: resourceName })
  const state = job.state
  const done = state !== undefined && TERMINAL_STATES.has(state)
  const succeeded = state !== undefined && SUCCESS_STATES.has(state)

  // Base prefix of this batch's staged objects (…/{batchId}/), derived from the
  // input URI — covers both input.jsonl and the output/ subtree for cleanup.
  const inputUri = job.src?.gcsUri?.[0]
  const artifactPrefix = inputUri ? inputUri.slice(0, inputUri.lastIndexOf("/") + 1) : undefined

  const verdicts: BatchVerdict[] = []
  if (succeeded) {
    const outDir = job.outputInfo?.gcsOutputDirectory ?? job.dest?.gcsUri
    if (!outDir) throw new Error(`batch ${resourceName} succeeded but reported no output location`)

    const raw = await readBatchJsonlUnder(outDir)
    const outLines = raw.split("\n").map((l) => l.trim()).filter(Boolean)
    outLines.forEach((line, index) => {
      try {
        const out = JSON.parse(line) as { key?: string; status?: string; response?: unknown }
        if (out.status) {
          // Non-empty status is Vertex's per-row error marker.
          verdicts.push({ index, key: out.key, verdict: null })
          return
        }
        verdicts.push({ index, key: out.key, verdict: parseVerdict(extractText(out.response)) })
      } catch (err) {
        log.warn("llm-classifier-batch: unparseable output line", { resourceName, index, err: String(err) })
        verdicts.push({ index, key: undefined, verdict: null })
      }
    })
  }

  return { state, done, succeeded, verdicts, artifactPrefix }
}

// Pull the model text out of an echoed GenerateContentResponse.
function extractText(response: unknown): string {
  const parts = (response as { candidates?: { content?: { parts?: { text?: string }[] } }[] } | undefined)
    ?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ""
  return parts.map((p) => p?.text ?? "").join("")
}
