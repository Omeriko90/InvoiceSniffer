import { GoogleGenAI } from "@google/genai"

// Shared Google Gemini client, used by the invoice-detection classifier, the
// Tier 2 PDF extractor (llm-extractor.ts), and the Tier 3 reconcile arbitrator
// (match-arbitrator.ts).
//
// Two backends, auto-selected by env so we can move between them with no code
// change:
//   • Gemini Developer API — used when GEMINI_API_KEY is set (from
//     aistudio.google.com). Simplest to run anywhere. Use a billing-enabled
//     ("paid tier") project so prompts aren't used to train Google's models.
//   • Vertex AI — the fallback when GEMINI_API_KEY is unset. Auth is GCP
//     Application Default Credentials (the Cloud Run service account in prod,
//     or `gcloud auth application-default login` locally), with project and
//     location from GCP_PROJECT_ID / GCP_REGION.
//
// The model is still picked per call site via env (EXTRACTION_MODEL /
// RECONCILE_ARBITER_MODEL / CLASSIFIER_MODEL), e.g. "gemini-2.5-flash", so it
// can be swapped without code changes. Callers handle errors (fail-open).

const DEFAULT_LOCATION = "us-central1"

let client: GoogleGenAI | null = null

export function geminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY
    client = apiKey
      ? new GoogleGenAI({ apiKey })
      : new GoogleGenAI({
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
