import { GoogleGenAI } from "@google/genai"

// Shared Google Gemini client (Vertex AI), used by the invoice-detection
// classifier, the Tier 2 PDF extractor (llm-extractor.ts), and the Tier 3
// reconcile arbitrator (match-arbitrator.ts).
//
// Auth is GCP Application Default Credentials — the Cloud Run service account in
// prod, or `gcloud auth application-default login` locally — so there is no API
// key. Project and location reuse the existing GCP env convention:
//   GCP_PROJECT_ID    Vertex project (required)
//   VERTEX_LOCATION   Vertex model location; falls back to GCP_REGION, then
//                     "us-central1". Set to "global" for models served only on
//                     the global endpoint (all Gemini 3.x). Kept separate from
//                     GCP_REGION because that also pins Cloud Run Jobs / GCS,
//                     which need a real region, not "global".
//
// One model drives every LLM-backed feature — classification, PDF vision
// extraction, categorization, reconcile arbitration. Set LLM_MODEL (e.g.
// "gemini-2.5-flash") and everything runs on it, swappable to any model the
// Vertex client accepts without code changes. Leaving it unset disables every
// LLM tier. Callers handle errors (fail-open).

const DEFAULT_LOCATION = "us-central1"

let client: GoogleGenAI | null = null

export function geminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({
      vertexai: true,
      project: process.env.GCP_PROJECT_ID,
      location: process.env.VERTEX_LOCATION ?? process.env.GCP_REGION ?? DEFAULT_LOCATION,
    })
  }
  return client
}

// The single model every LLM call site uses, so one LLM_MODEL configures the
// whole app — any model name the Vertex client accepts. Undefined when unset,
// which each caller treats as "feature disabled".
export function llmModel(): string | undefined {
  return process.env.LLM_MODEL || undefined
}
