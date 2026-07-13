import { formatDistanceToNowStrict } from "date-fns"
import type { LearnedRule, Member } from "@/api-types/settings"

// "4 minutes" → "4m", matching the compact style used across the app
export function syncedLabel(lastSyncedAt: string | null): string {
  if (!lastSyncedAt) return "not synced yet"
  const distance = formatDistanceToNowStrict(new Date(lastSyncedAt))
    .replace(/ seconds?/, "s")
    .replace(/ minutes?/, "m")
    .replace(/ hours?/, "h")
    .replace(/ days?/, "d")
    .replace(/ months?/, "mo")
    .replace(/ years?/, "y")
  return `synced ${distance} ago`
}

export function initials(member: Member): string {
  if (member.name) {
    return member.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }
  return member.email[0]?.toUpperCase() ?? "?"
}

export function ruleTarget(rule: LearnedRule): string {
  if (rule.type === "IGNORE") return "no invoice"
  if (rule.type === "NEGATIVE") return `≠ ${rule.vendorName}`
  return rule.vendorName
}
