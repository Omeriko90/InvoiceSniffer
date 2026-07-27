// Smoke-test the Gemini integration end to end: backend selection, auth, model
// access, and structured-output round-trip. Does NOT touch Gmail/DB.
//   npx tsx scripts/smoke-gemini.ts
import "dotenv/config"
import { Type } from "@google/genai"
import { geminiClient, isGeminiModel } from "@/lib/gemini"

function report() {
  console.log("── Gemini smoke test ──────────────────────────────")
  console.log("backend:        Vertex AI (ADC)")
  console.log(`  GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID ?? "(unset!)"}`)
  console.log(`  GCP_REGION:     ${process.env.GCP_REGION ?? "us-central1 (default)"}`)
  const feats = {
    CLASSIFIER_MODEL: process.env.CLASSIFIER_MODEL,
    EXTRACTION_MODEL: process.env.EXTRACTION_MODEL,
    RECONCILE_ARBITER_MODEL: process.env.RECONCILE_ARBITER_MODEL,
  }
  for (const [k, v] of Object.entries(feats)) {
    const state = !v ? "disabled (unset)" : isGeminiModel(v) ? `enabled → ${v}` : `DISABLED — not a gemini-* model (${v})`
    console.log(`${k.padEnd(24)}${state}`)
  }
  return feats
}

async function main() {
  const feats = report()

  // Use a configured feature model if present, else a sensible default, so the
  // test reflects the model the app will actually call.
  const model =
    [feats.EXTRACTION_MODEL, feats.CLASSIFIER_MODEL, feats.RECONCILE_ARBITER_MODEL].find(isGeminiModel) ??
    "gemini-2.5-flash"

  console.log(`\nCalling ${model} with a structured-output request …`)
  const res = await geminiClient().models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: "Return ok=true and echo the word 'ready' in note." }] }],
    config: {
      maxOutputTokens: 256,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { ok: { type: Type.BOOLEAN }, note: { type: Type.STRING } },
        required: ["ok", "note"],
      },
    },
  })

  const text = res.text
  console.log(`raw response:   ${text}`)
  const parsed = JSON.parse(text ?? "{}")
  if (parsed.ok === true) {
    console.log("\n✅ SUCCESS — Gemini reachable, model accessible, structured output parsed.")
  } else {
    console.log("\n⚠️  Reached the model but response shape was unexpected.")
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error("\n❌ FAILED:", err?.message ?? err)
  console.error(
    "\nCommon causes:\n" +
      "  • ADC not set (run: gcloud auth application-default login)\n" +
      "  • Vertex AI API not enabled / service account lacks roles/aiplatform.user\n" +
      "  • GCP_PROJECT_ID / GCP_REGION unset, or model not available in the region"
  )
  process.exitCode = 1
})
