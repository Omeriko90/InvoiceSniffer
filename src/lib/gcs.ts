import { Storage } from "@google-cloud/storage"

// Google Cloud Storage, used only to stage the Gemini Batch API's input/output.
// Vertex batch prediction requires GCS (or BigQuery) URIs — it rejects inline
// requests — so the batch classifier (llm-classifier-batch.ts) writes an
// input.jsonl here and reads the predictions.jsonl Vertex writes back. Auth is
// the same Vertex ADC as everything else; only the bucket name is new config.

let storage: Storage | null = null

function client(): Storage {
  if (!storage) storage = new Storage({ projectId: process.env.GCP_PROJECT_ID })
  return storage
}

// Bucket for batch staging. Unset → the batch classifier stays disabled and the
// sync keeps using the inline classifier (see batchClassifierEnabled()).
export function batchGcsBucket(): string | undefined {
  return process.env.CLASSIFIER_BATCH_GCS_BUCKET || undefined
}

function requireBucket(): string {
  const bucket = batchGcsBucket()
  if (!bucket) throw new Error("CLASSIFIER_BATCH_GCS_BUCKET is not set — cannot stage batch input")
  return bucket
}

// Split a gs://bucket/prefix URI into its bucket and object-prefix parts.
export function parseGcsUri(uri: string): { bucket: string; prefix: string } {
  const m = /^gs:\/\/([^/]+)\/?(.*)$/.exec(uri)
  if (!m) throw new Error(`not a gs:// URI: ${uri}`)
  return { bucket: m[1], prefix: m[2] }
}

// Upload text (JSONL) to the batch bucket; returns the gs:// URI of the object.
export async function putBatchObject(key: string, contents: string): Promise<string> {
  const bucket = requireBucket()
  await client().bucket(bucket).file(key).save(contents, { contentType: "application/x-ndjson" })
  return `gs://${bucket}/${key}`
}

// Download and concatenate every *.jsonl object under a gs:// prefix. Vertex
// writes predictions under the dest prefix (sometimes in a subfolder), so we
// list rather than assume a fixed filename.
export async function readBatchJsonlUnder(gcsUriPrefix: string): Promise<string> {
  const { bucket, prefix } = parseGcsUri(gcsUriPrefix)
  const [files] = await client().bucket(bucket).getFiles({ prefix })
  const jsonlFiles = files.filter((f) => f.name.endsWith(".jsonl"))
  const parts = await Promise.all(
    jsonlFiles.map(async (f) => {
      const [buf] = await f.download()
      return buf.toString("utf8")
    })
  )
  return parts.join("\n")
}

// Delete every object under a gs:// prefix (a batch's input + output). Best used
// after a batch is consumed; a bucket lifecycle rule is the safety net for
// anything a crash leaves behind.
export async function deleteUnder(gcsUriPrefix: string): Promise<void> {
  const { bucket, prefix } = parseGcsUri(gcsUriPrefix)
  await client().bucket(bucket).deleteFiles({ prefix, force: true })
}
