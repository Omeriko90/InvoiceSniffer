export type MemberRole = "OWNER" | "ADMIN" | "MEMBER"

export type RuleType = "POSITIVE" | "NEGATIVE" | "IGNORE"

export interface GmailConnection {
  id: string
  connected: boolean
  email: string
  label: string | null
  lastSyncedAt: string | null
}

export interface Member {
  id: string
  name: string | null
  email: string
  role: MemberRole
}

export interface LearnedRule {
  id: string
  merchantPattern: string
  vendorName: string
  type: RuleType
}

export type IntegrationProvider =
  | "MORNING"
  | "XERO"
  | "ICOUNT"
  | "QUICKBOOKS"
  | "FRESHBOOKS"
  | "SUMIT"
  | "BIZIBOX"
  | "TAKZIVIT"
  | "PAPERLESS"

export type IntegrationDirection = "PULL" | "PUSH" | "BOTH"

export interface IntegrationCapabilities {
  canPull: boolean
  canPush: boolean
}

// A connectable platform in the catalog (whether or not this org connected it).
export interface IntegrationCatalogEntry {
  provider: IntegrationProvider
  name: string
  authKind: "oauth2" | "apiKey"
  capabilities: IntegrationCapabilities
  region: "IL" | "GLOBAL"
  // Whether a live connector exists yet (false = "coming soon").
  implemented: boolean
}

// One of this org's connected integration accounts.
export interface ConnectedIntegration {
  id: string
  provider: IntegrationProvider
  label: string | null
  connected: boolean
  direction: IntegrationDirection
  lastPulledAt: string | null
  capabilities: IntegrationCapabilities
}

export interface IntegrationsData {
  catalog: IntegrationCatalogEntry[]
  connected: ConnectedIntegration[]
  maxIntegrations: number
}

export interface SettingsData {
  gmails: GmailConnection[]
  members: Member[]
  rules: LearnedRule[]
  // Max days a card charge may post after its invoice (reconcile match window).
  settlementLagDays: number
  // Max number of *connected* Gmail mailboxes this org's plan allows.
  maxGmailAccounts: number
  // Accounting-platform integrations (catalog + this org's connections).
  integrations: IntegrationsData
}
