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

export interface WhatsAppNumberInfo {
  id: string
  phoneE164: string
  verified: boolean
  createdAt: string
}

export interface SettingsData {
  gmails: GmailConnection[]
  members: Member[]
  rules: LearnedRule[]
  // Max days a card charge may post after its invoice (reconcile match window).
  settlementLagDays: number
  displayCurrency: string
  // Max number of *connected* Gmail mailboxes this org's plan allows.
  maxGmailAccounts: number
  // Linked WhatsApp numbers + the per-plan cap.
  whatsappNumbers: WhatsAppNumberInfo[]
  maxWhatsAppNumbers: number
}

// Returned by POST /api/whatsapp — the pending number plus the code + wa.me link
// the user taps to prove ownership.
export interface WhatsAppRegistration {
  number: WhatsAppNumberInfo
  verificationCode: string
  waLink: string | null
}
