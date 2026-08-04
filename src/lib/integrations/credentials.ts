import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/encryption"
import type { IntegrationCredential, InvoiceSource } from "@prisma/client"
import type { IntegrationDirection } from "./types"

// Shared credential plumbing for every accounting connector — the provider-
// agnostic analog of saveGmailCredential()/getGmailClient(). Secrets are stored
// as one AES-256-GCM encrypted JSON blob (IntegrationCredential.secrets); these
// helpers are the only place that blob is read or written, so connectors deal in
// plain objects and never touch encryption.

// Decrypt and parse the stored secrets blob. Shape is connector-defined
// (oauth2 -> {accessToken,…}; apiKey -> {id,secret,jwt?,…}).
export function readSecrets<T extends Record<string, unknown>>(cred: IntegrationCredential): T {
  return JSON.parse(decrypt(cred.secrets)) as T
}

// Re-encrypt and persist an updated secrets object — used by connectors after a
// token/JWT refresh. Kept narrow (only touches `secrets`) so a refresh can never
// clobber other credential fields.
export async function persistSecrets(
  credentialId: string,
  secrets: Record<string, unknown>
): Promise<void> {
  await prisma.integrationCredential.update({
    where: { id: credentialId },
    data: { secrets: encrypt(JSON.stringify(secrets)) },
  })
}

export type SaveIntegrationInput = {
  organizationId: string
  provider: InvoiceSource
  authKind: "oauth2" | "apiKey"
  secrets: Record<string, unknown>
  externalAccountId?: string | null
  label?: string | null
  direction: IntegrationDirection
  config?: Record<string, unknown>
}

// Upsert a connected account, keyed by (org, provider, externalAccountId) — the
// same identity used for the DB unique constraint. Re-connecting an existing
// account refreshes its secrets and flips `connected` back on without losing
// history (invoices/category maps keep their FK).
export async function saveIntegrationCredential(
  input: SaveIntegrationInput
): Promise<IntegrationCredential> {
  const secrets = encrypt(JSON.stringify(input.secrets))
  // The compound unique key requires a non-null externalAccountId. Every real
  // provider yields one (Morning business id, Xero tenant id); fall back to the
  // provider name so single-account providers still get a stable key.
  const externalAccountId = input.externalAccountId ?? input.provider
  const data = {
    label: input.label ?? null,
    authKind: input.authKind,
    secrets,
    direction: input.direction,
    connected: true,
    ...(input.config ? { config: input.config as never } : {}),
  }
  return prisma.integrationCredential.upsert({
    where: {
      organizationId_provider_externalAccountId: {
        organizationId: input.organizationId,
        provider: input.provider,
        externalAccountId,
      },
    },
    create: {
      organizationId: input.organizationId,
      provider: input.provider,
      externalAccountId,
      ...data,
    },
    update: data,
  })
}

// Soft-disconnect: clear secrets and flip `connected` off, preserving pulled
// invoices and push history. Mirrors the Gmail disconnect behavior. Called on
// user action and by connectors when a refresh token is permanently rejected.
export async function markIntegrationDisconnected(credentialId: string): Promise<void> {
  await prisma.integrationCredential.update({
    where: { id: credentialId },
    data: { connected: false, secrets: encrypt("{}") },
  })
}
