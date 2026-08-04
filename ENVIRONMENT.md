# Environment Variables

All environment variables used by the project, grouped by function.

> One var is read **implicitly by the SDK** (not via `process.env`), so it
> doesn't appear in a code grep: `AUTH_SECRET` (NextAuth v5).
>
> All three LLM features (classifier, extractor, arbitrator) run on Google
> Gemini via **Vertex AI**. Auth is GCP Application Default Credentials (the
> Cloud Run service account in prod, or `gcloud auth application-default login`
> locally) — no API key. They share `GCP_PROJECT_ID` / `GCP_REGION`, and the
> runtime service account needs the **Vertex AI User** role
> (`roles/aiplatform.user`). Each feature is enabled by its own `*_MODEL` var
> below.

## Core (required)

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres/Neon connection (pooled) |
| `DIRECT_URL` | Direct Postgres connection for Prisma migrations |
| `AUTH_SECRET` | NextAuth v5 session/JWT signing secret (implicit) |
| `NEXTAUTH_URL` | Canonical app URL for auth callbacks |
| `TOKEN_ENCRYPTION_KEY` | Encrypts stored Gmail OAuth tokens |

## Google / Gmail OAuth (required for sync)

| Var | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | Gmail OAuth client |
| `GOOGLE_CLIENT_SECRET` | Gmail OAuth secret |

## Queue / Worker (required for sync + exports to process)

| Var | Purpose |
|---|---|
| `REDIS_URL` | BullMQ/Redis (Upstash) connection |
| `WORKER_TRIGGER` | Set to `cloudrun` in prod to fire the Cloud Run Job (else on-demand drain is a no-op) |
| `GCP_PROJECT_ID` | Required when `WORKER_TRIGGER=cloudrun` |
| `GCP_REGION` | Required when `WORKER_TRIGGER=cloudrun` |
| `WORKER_JOB_NAME` | Cloud Run Job name to execute |
| `MODE` | Set per Cloud Run Job execution (`daily` / `drain` / `export`), not on the web tier |

## Storage — Cloudflare R2 (required for PDF attachments/exports)

| Var | Purpose |
|---|---|
| `R2_ACCOUNT_ID` | R2 account |
| `R2_ACCESS_KEY_ID` | R2 credentials |
| `R2_SECRET_ACCESS_KEY` | R2 credentials |
| `R2_BUCKET` | Bucket name |

## LLM classifier (invoice detection)

Second opinion on borderline invoice-detection scores. Runs on Google Gemini
(backend auto-selected — see the LLM note at the top).
- Set `CLASSIFIER_MODEL` (e.g. `gemini-2.5-flash`).
- `CLASSIFIER_MODEL` unset (or non-`gemini-*`) → classifier disabled; falls back to heuristics.

### Batch mode (optional, enabled by setting `CLASSIFIER_BATCH_GCS_BUCKET`)

By default each borderline email is classified with one **synchronous** Gemini
call inside the Gmail sync. Set `CLASSIFIER_BATCH_GCS_BUCKET` to instead **defer**
those emails to the asynchronous [Gemini Batch API](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/batch-prediction-gemini)
(~50% cheaper): the sync submits one batch job and returns; a later
`MODE=classify-consume` run applies the verdicts and enqueues extractions.

- Enabled when a valid `CLASSIFIER_MODEL` **and** `CLASSIFIER_BATCH_GCS_BUCKET` are set; unset the bucket and the sync uses the inline classifier.
- Vertex batch requires a GCS staging bucket (it rejects inline requests). Input/output JSONL live under `classifier-batches/…` in that bucket. Uses the same Vertex ADC as every other tier — the worker SA needs `roles/aiplatform.user` **and** `roles/storage.objectAdmin` on the bucket. Keep the bucket in the same region as `GCP_REGION`.
- Cleanup: `classify-consume` deletes each batch's staged objects after applying its verdicts. Add a bucket **lifecycle rule** as a safety net for anything a crash leaves behind, e.g. delete objects after 7 days:
  ```
  gcloud storage buckets update gs://BUCKET \
    --add-lifecycle-rule action=Delete,age=7
  ```
- Fail-open preserved: if a batch fails/expires or a submit throws, the heuristic threshold decides, so no email is dropped.
- **Requires a scheduled consumer.** Trigger the worker Cloud Run Job with `MODE=classify-consume` on a short interval (~15 min), the same way the daily `MODE=daily` job is scheduled. Example:
  ```
  gcloud scheduler jobs create http classify-consume \
    --location "$REGION" --schedule "*/15 * * * *" \
    --uri "https://$REGION-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$PROJECT_ID/jobs/invoicesniffer-worker:run" \
    --oauth-service-account-email "<worker-invoker-SA>" \
    --headers "Content-Type=application/json" \
    --message-body '{"overrides":{"containerOverrides":[{"env":[{"name":"MODE","value":"classify-consume"}]}]}}'
  ```
- Validate inline batch works on Vertex first: `npx tsx scripts/smoke-batch-classifier.ts`.

| Var | Purpose |
|---|---|
| `CLASSIFIER_MODEL` | Which Gemini model to use (e.g. `gemini-2.5-flash`); unset/non-`gemini-*` = disabled |
| `CLASSIFIER_BATCH_GCS_BUCKET` | Set → classify borderline emails via the async Gemini Batch API, staging JSONL in this bucket (also needs the `classify-consume` scheduler); unset = synchronous inline calls |

## LLM extractor — Tier 2 structured extraction (optional)

Structured PDF-vision extraction that captures fields the regex heuristics can't
(Israeli Tax Authority allocation number, vendor tax id, document type, line
items) and cracks mojibake/RTL PDFs. Runs only when it uniquely helps: heuristics
found no amount, or an Israeli document is missing the allocation number.

- Runs on Google Gemini (backend auto-selected — see the LLM note at the top). Set `EXTRACTION_MODEL` (e.g. `gemini-2.5-flash`).
- `EXTRACTION_MODEL` unset (or non-`gemini-*`) → extractor disabled; behaviour is heuristics-only, as before.
- Any error falls back to the heuristic result (fail-open).

| Var | Purpose |
|---|---|
| `EXTRACTION_MODEL` | Which Gemini model to use for PDF extraction (e.g. `gemini-2.5-flash`); unset/non-`gemini-*` = disabled |
| `GCP_PROJECT_ID` / `GCP_REGION` | Vertex AI project + location (shared by all LLM features) |

> Privacy: enabling this sends invoice PDF contents to Google Vertex AI, which
> does not use your data to train Google's models. Add a line to the privacy
> note before the app has real users.

## LLM expense categorizer — auto-category at ingest (optional)

Assigns every invoice a business expense category (Marketing, Software, Travel,
…) at ingest. Unlike the PDF extractor, this runs for **every** invoice — but
it's a cheap **text-only** call (vendor + subject + line items, no PDF image),
so full coverage stays affordable. Categories power the invoices-page filter and
the dashboard's spend-by-category breakdown, and the user can override any
invoice's category by hand.

- Runs on Google Gemini (backend auto-selected — see the LLM note at the top). Set `CATEGORIZATION_MODEL` (e.g. `gemini-2.5-flash`).
- `CATEGORIZATION_MODEL` unset (or non-`gemini-*`) → categorizer disabled; every invoice stays `UNCATEGORIZED` until set by hand.
- Any error (or genuine uncertainty) leaves the invoice `UNCATEGORIZED` (fail-open).
- Applied only when an invoice is first created — re-extraction never overwrites a category (auto or manual).

| Var | Purpose |
|---|---|
| `CATEGORIZATION_MODEL` | Which Gemini model to use for expense categorization (e.g. `gemini-2.5-flash`); unset/non-`gemini-*` = disabled |

> Privacy: enabling this sends invoice metadata (vendor, subject, line-item text)
> to Google Vertex AI, which does not use your data to train Google's models.

## LLM reconcile arbitrator — Tier 3 match fallback (optional)

The deterministic matcher refuses to match a charge on amount + date alone; it
needs an identity signal (learned alias, invoice # in the bank text, or vendor
name overlap). That leaves obfuscated bank descriptors (e.g. `PAYPAL *DESIGNSUPPORT`)
with no candidate. When enabled, the arbitrator re-checks the ambiguous rows,
asks the model whether any amount/date-matching invoice is genuinely the same
purchase, and surfaces its picks as **Possible** (never auto-confirmed). One user
confirmation then teaches a vendor alias, so that merchant matches deterministically
afterwards — the model is paid ~once per obfuscated merchant.

- Runs on Google Gemini (backend auto-selected — see the LLM note at the top). Set `RECONCILE_ARBITER_MODEL` (e.g. `gemini-2.5-flash`).
- `RECONCILE_ARBITER_MODEL` unset (or non-`gemini-*`) → disabled; the deterministic result stands, as before.
- Any error falls back to the deterministic result (fail-open).
- Adds latency to `POST /api/reconcile/match` when on (one model call per ambiguous row, bounded concurrency).

| Var | Purpose |
|---|---|
| `RECONCILE_ARBITER_MODEL` | Which Gemini model to arbitrate ambiguous matches (e.g. `gemini-2.5-flash`); unset/non-`gemini-*` = disabled |
| `RECONCILE_ARBITER_MAX_ROWS` | Max ambiguous rows sent to the model per session (default 25); excess are logged and left deterministic |

> Privacy: enabling this sends charge descriptors + candidate invoice metadata to
> Google Gemini.

## Analytics — PostHog (optional; degrades gracefully if unset)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Client-side PostHog key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host |
| `POSTHOG_LOGS_TOKEN` | Server-side log capture token |

## Set automatically (do not configure)

`NODE_ENV` and `NEXT_RUNTIME` are set by Next.js / the runtime.
