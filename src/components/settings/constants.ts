import type { MemberRole, RuleType } from "@/api-types/settings"

// `className` = badge background + text color, token-based where a token exists.
export const ROLE_META: Record<MemberRole, { label: string; className: string }> = {
  OWNER:  { label: "Owner",  className: "bg-purple-bg text-purple-fg" },
  ADMIN:  { label: "Admin",  className: "bg-info-bg text-primary-strong" },
  MEMBER: { label: "Member", className: "bg-hover text-text-secondary" },
}

// `className` = background + border color + text, all token-based.
export const RULE_META: Record<RuleType, { className: string }> = {
  POSITIVE: { className: "bg-success-bg border-success-border text-success-fg" },
  NEGATIVE: { className: "bg-danger-bg border-danger-border text-danger-fg" },
  IGNORE:   { className: "bg-purple-bg border-purple-border text-purple-fg" },
}
