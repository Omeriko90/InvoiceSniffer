export type MemberRole = "OWNER" | "ADMIN" | "MEMBER"

export type RuleType = "POSITIVE" | "NEGATIVE" | "IGNORE"

export interface GmailConnection {
  connected: boolean
  email: string | null
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

export interface SettingsData {
  gmail: GmailConnection
  members: Member[]
  rules: LearnedRule[]
}
