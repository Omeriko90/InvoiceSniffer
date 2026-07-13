import type { MemberRole, RuleType } from "@/api-types/settings"

export const ROLE_META: Record<
  MemberRole,
  { label: string; color: string; bg: string }
> = {
  OWNER: { label: "Owner", color: "#7C3AED", bg: "#F5F3FF" },
  ADMIN: { label: "Admin", color: "#3B6FE0", bg: "#EFF6FF" },
  MEMBER: { label: "Member", color: "#64748B", bg: "#F1F3F8" },
}

export const RULE_META: Record<RuleType, { color: string; bg: string; border: string }> = {
  POSITIVE: { color: "#047857", bg: "#ECFDF5", border: "#BBE7CD" },
  NEGATIVE: { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
  IGNORE:   { color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" },
}
