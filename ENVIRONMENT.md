# Environment Variables

All environment variables used by the project, grouped by function.

> Two vars are read **implicitly by SDKs** (not via `process.env`), so they don't
> appear in a code grep: `AUTH_SECRET` (NextAuth v5) and `ANTHROPIC_API_KEY`
> (Anthropic SDK `new Anthropic()`).

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

## LLM classifier (invoice extraction)

Pick a `CLASSIFIER_MODEL`, then set exactly one key path:
- Model starts with `claude` → set `ANTHROPIC_API_KEY`.
- Any other model → set `CLASSIFIER_API_KEY` (and `CLASSIFIER_API_BASE` unless using OpenAI).
- `CLASSIFIER_MODEL` unset → classifier disabled; falls back to heuristics (no key needed).

| Var | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Used when `CLASSIFIER_MODEL` is a `claude-*` model (implicit) |
| `CLASSIFIER_MODEL` | Which model to use |
| `CLASSIFIER_API_BASE` | Override base URL for a non-Anthropic/OpenAI-compatible endpoint |
| `CLASSIFIER_API_KEY` | Key for the custom `CLASSIFIER_API_BASE` endpoint |

## LLM extractor — Tier 2 structured extraction (optional)

Structured PDF-vision extraction that captures fields the regex heuristics can't
(Israeli Tax Authority allocation number, vendor tax id, document type, line
items) and cracks mojibake/RTL PDFs. Runs only when it uniquely helps: heuristics
found no amount, or an Israeli document is missing the allocation number.

- Set `EXTRACTION_MODEL` (start with `claude-haiku-4-5`, ~$0.005–0.01/invoice) and `ANTHROPIC_API_KEY`.
- `EXTRACTION_MODEL` unset → extractor disabled; behaviour is heuristics-only, as before.
- Only `claude-*` models are supported; any error falls back to the heuristic result (fail-open).

| Var | Purpose |
|---|---|
| `EXTRACTION_MODEL` | Which claude model to use for PDF extraction (e.g. `claude-haiku-4-5`); unset = disabled |
| `ANTHROPIC_API_KEY` | Read by the SDK for the extractor (and the classifier) |

> Privacy: enabling this sends invoice PDF contents to the Anthropic API. Add a
> line to the privacy note before the app has real users.

## LLM reconcile arbitrator — Tier 3 match fallback (optional)

The deterministic matcher refuses to match a charge on amount + date alone; it
needs an identity signal (learned alias, invoice # in the bank text, or vendor
name overlap). That leaves obfuscated bank descriptors (e.g. `PAYPAL *DESIGNSUPPORT`)
with no candidate. When enabled, the arbitrator re-checks the ambiguous rows,
asks the model whether any amount/date-matching invoice is genuinely the same
purchase, and surfaces its picks as **Possible** (never auto-confirmed). One user
confirmation then teaches a vendor alias, so that merchant matches deterministically
afterwards — the model is paid ~once per obfuscated merchant.

- Set `RECONCILE_ARBITER_MODEL` (start with `claude-haiku-4-5`) and `ANTHROPIC_API_KEY`.
- `RECONCILE_ARBITER_MODEL` unset → disabled; the deterministic result stands, as before.
- Only `claude-*` models are supported; any error falls back to the deterministic result (fail-open).
- Adds latency to `POST /api/reconcile/match` when on (one model call per ambiguous row, bounded concurrency).

| Var | Purpose |
|---|---|
| `RECONCILE_ARBITER_MODEL` | Which claude model to arbitrate ambiguous matches (e.g. `claude-haiku-4-5`); unset = disabled |
| `RECONCILE_ARBITER_MAX_ROWS` | Max ambiguous rows sent to the model per session (default 25); excess are logged and left deterministic |
| `ANTHROPIC_API_KEY` | Read by the SDK for the arbitrator (and the extractor/classifier) |

> Privacy: enabling this sends charge descriptors + candidate invoice metadata to
> the Anthropic API.

## Analytics — PostHog (optional; degrades gracefully if unset)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Client-side PostHog key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host |
| `POSTHOG_LOGS_TOKEN` | Server-side log capture token |

## Set automatically (do not configure)

`NODE_ENV` and `NEXT_RUNTIME` are set by Next.js / the runtime.
