# Deployment

Merges to `main` are deployed automatically by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): it applies DB
migrations, builds the `web` and `worker` images, deploys the Cloud Run service
`invoicesniffer-web`, and updates the Cloud Run job `invoicesniffer-worker`.

Auth is **keyless** via Workload Identity Federation — no service-account key is
stored in GitHub. The steps below are a **one-time setup**; after that, deploys
are automatic.

## 1. GitHub secrets

Add these repo secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `DIRECT_URL` | Neon **direct/unpooled** connection string (used by `prisma migrate deploy`) |
| `DATABASE_URL` | Neon pooled connection string (fallback) |

Nothing else is needed — GCP access is via WIF, configured below.

## 2. One-time GCP setup (Workload Identity Federation)

Run these once with an account that has project IAM admin. Values match the
identifiers hard-coded in the workflow.

```bash
PROJECT=invoicesniffer
PROJECT_NUMBER=336612643167
REPO=Omeriko90/InvoiceSniffer
RUNTIME_SA=336612643167-compute@developer.gserviceaccount.com   # Cloud Run runtime SA

# 2a. Dedicated deployer service account
gcloud iam service-accounts create deployer \
  --project "$PROJECT" --display-name "GitHub Actions deployer"
DEPLOYER="deployer@${PROJECT}.iam.gserviceaccount.com"

# 2b. Roles the deployer needs
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member "serviceAccount:$DEPLOYER" --role roles/run.admin
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member "serviceAccount:$DEPLOYER" --role roles/artifactregistry.writer
# act as the runtime SA when deploying (least-privilege: bound to that SA only)
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --project "$PROJECT" \
  --member "serviceAccount:$DEPLOYER" --role roles/iam.serviceAccountUser

# 2c. Workload Identity pool + provider, locked to THIS repo
gcloud iam workload-identity-pools create github-pool \
  --project "$PROJECT" --location global --display-name "GitHub pool"

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --project "$PROJECT" --location global \
  --workload-identity-pool github-pool \
  --display-name "GitHub provider" \
  --issuer-uri "https://token.actions.githubusercontent.com" \
  --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition "assertion.repository=='${REPO}'"

# 2d. Let the repo's Actions impersonate the deployer SA
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER" \
  --project "$PROJECT" --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}"
```

The workflow references the provider as
`projects/336612643167/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
and the SA `deployer@invoicesniffer.iam.gserviceaccount.com` — if you change any
name above, update `.github/workflows/deploy.yml` to match.

## 3. Runtime env (set once on the Cloud Run resources, not in CI)

The workflow deploys with `--image` only, so it preserves each resource's env
and secrets. Configure those once on the resources themselves (see
[ENVIRONMENT.md](ENVIRONMENT.md)) — notably the Gemini/Vertex vars:
`GCP_PROJECT_ID`, `GCP_REGION`, and the per-feature `*_MODEL` vars. Make sure
`GEMINI_API_KEY` is **not** set (the app uses Vertex).

## Manual run

Trigger a deploy without a merge from the Actions tab → **Deploy to GCP** →
**Run workflow**, or `gh workflow run "Deploy to GCP"`.
