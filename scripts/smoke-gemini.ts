// Smoke-test the Gemini integration end to end: backend selection, auth, model
// access, and structured-output round-trip. Does NOT touch Gmail/DB.
//   npx tsx scripts/smoke-gemini.ts
import "dotenv/config"
import { Type } from "@google/genai"
import { geminiClient, llmModel } from "@/lib/gemini"

function report() {
  console.log("── Gemini smoke test ──────────────────────────────")
  console.log("backend:        Vertex AI (ADC)")
  console.log(`  GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID ?? "(unset!)"}`)
  console.log(`  GCP_REGION:     ${process.env.GCP_REGION ?? "us-central1 (default)"}`)
  // One model drives every LLM feature (classifier, extractor, categorizer,
  // arbitrator); any value enables them all, unset disables them.
  const model = llmModel()
  console.log(`LLM_MODEL               ${model ? `enabled → ${model}` : "disabled (unset) — all LLM features off"}`)
  return model
}

async function main() {
  const configured = report()

  // Test the configured model, else a sensible default so the round-trip still runs.
  const model = configured ?? "gemini-2.5-flash"

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
