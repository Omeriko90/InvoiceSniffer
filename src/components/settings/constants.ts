import type { MemberRole, RuleType } from "@/api-types/settings"

// `className` = badge background + text color, token-based where a token exists.
export const ROLE_META: Record<MemberRole, { label: string; className: string }> = {
  OWNER:  { label: "Owner",  className: "bg-purple-bg text-purple-fg" },
  ADMIN:  { label: "Admin",  className: "bg-info-bg text-primary-strong" },
  MEMBER: { label: "Member", className: "bg-hover text-text-secondary" },
}

// `className` = background + border color + text. The deep chip text/border
// shades (#047857/#B91C1C/#6D28D9/#DDD6FE) have no token, so stay arbitrary.
export const RULE_META: Record<RuleType, { className: string }> = {
  POSITIVE: { className: "bg-success-bg border-success-border text-[#047857]" },
  NEGATIVE: { className: "bg-danger-bg border-danger-border text-[#B91C1C]" },
  IGNORE:   { className: "bg-purple-bg border-[#DDD6FE] text-[#6D28D9]" },
}
