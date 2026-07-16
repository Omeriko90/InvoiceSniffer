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

## Analytics — PostHog (optional; degrades gracefully if unset)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Client-side PostHog key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host |
| `POSTHOG_LOGS_TOKEN` | Server-side log capture token |

## Set automatically (do not configure)

`NODE_ENV` and `NEXT_RUNTIME` are set by Next.js / the runtime.
