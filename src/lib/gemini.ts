import { GoogleGenAI } from "@google/genai"

// Shared Google Gemini client, used by the Tier 2 PDF extractor
// (llm-extractor.ts) and the Tier 3 reconcile arbitrator (match-arbitrator.ts).
//
// We run against Vertex AI, so auth is Application Default Credentials — the
// Cloud Run service account in prod, or `gcloud auth application-default login`
// locally — with no API key to manage. Project and region reuse the existing
// GCP env convention (see worker-trigger.ts):
//   GCP_PROJECT_ID   Vertex project (required)
//   GCP_REGION       Vertex location, e.g. "us-central1" (defaults to us-central1)
//
// The model is still picked per call site via env (EXTRACTION_MODEL /
// RECONCILE_ARBITER_MODEL), e.g. "gemini-2.5-flash", so it can be swapped
// without code changes. Any runtime error is handled by the caller (fail-open).

const DEFAULT_LOCATION = "us-central1"

let client: GoogleGenAI | null = null

export function geminiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({
      vertexai: true,
      project: process.env.GCP_PROJECT_ID,
      location: process.env.GCP_REGION ?? DEFAULT_LOCATION,
    })
  }
  return client
}

// True when `model` names a Gemini model. Gates the LLM tiers the same way the
// old `startsWith("claude")` check did, so an unset/other model disables them.
export function isGeminiModel(model: string | undefined): model is string {
  return Boolean(model && model.startsWith("gemini"))
}
