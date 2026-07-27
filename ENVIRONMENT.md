# Environment Variables

All environment variables used by the project, grouped by function.

> One var is read **implicitly by the SDK** (not via `process.env`), so it
> doesn't appear in a code grep: `AUTH_SECRET` (NextAuth v5).
>
> All three LLM features (classifier, extractor, arbitrator) run on Google
> Gemini and share one backend, auto-selected in `gemini.ts`:
> - **Gemini Developer API** — set `GEMINI_API_KEY` (from aistudio.google.com).
>   Simplest; use a billing-enabled ("paid tier") project so prompts aren't used
>   for training.
> - **Vertex AI** — used when `GEMINI_API_KEY` is unset. Auth is GCP Application
>   Default Credentials (no key); needs `GCP_PROJECT_ID` / `GCP_REGION` and the
>   Vertex AI User role on the runtime service account.
>
> Either way, each feature is enabled by its own `*_MODEL` var below.

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

| Var | Purpose |
|---|---|
| `CLASSIFIER_MODEL` | Which Gemini model to use (e.g. `gemini-2.5-flash`); unset/non-`gemini-*` = disabled |

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
| `GEMINI_API_KEY` | Developer API key; when set, used instead of Vertex (shared by all LLM features) |
| `GCP_PROJECT_ID` / `GCP_REGION` | Vertex AI project + location; used only when `GEMINI_API_KEY` is unset |

> Privacy: enabling this sends invoice PDF contents to Google Gemini. On the
> Developer API, use a paid-tier project so prompts aren't used for training;
> Vertex never trains on your data. Add a line to the privacy note before the
> app has real users.

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
