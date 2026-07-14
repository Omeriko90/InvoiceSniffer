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

export interface SettingsData {
  gmails: GmailConnection[]
  members: Member[]
  rules: LearnedRule[]
}
