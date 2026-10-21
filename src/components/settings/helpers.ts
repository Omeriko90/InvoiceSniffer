import { formatDistanceToNowStrict } from "date-fns"
import type { LearnedRule, Member } from "@/api-types/settings"

// "4 minutes" → "4m", matching the compact style used across the app.
// Returns just the compact distance (e.g. "4m"), or null when never synced;
// callers wrap it with the localized "synced … ago" / "not synced yet" copy.
export function syncedDistance(lastSyncedAt: string | null): string | null {
  if (!lastSyncedAt) return null
  return formatDistanceToNowStrict(new Date(lastSyncedAt))
    .replace(/ seconds?/, "s")
    .replace(/ minutes?/, "m")
    .replace(/ hours?/, "h")
    .replace(/ days?/, "d")
    .replace(/ months?/, "mo")
    .replace(/ years?/, "y")
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

// Describes a rule's target for display. IGNORE has no vendor and needs a
// localized label; the others render the vendor name (NEGATIVE prefixed with ≠).
// The caller resolves the IGNORE label via i18n.
export function ruleTarget(
  rule: LearnedRule,
): { kind: "ignore" } | { kind: "vendor"; text: string } {
  if (rule.type === "IGNORE") return { kind: "ignore" }
  if (rule.type === "NEGATIVE") return { kind: "vendor", text: `≠ ${rule.vendorName}` }
  return { kind: "vendor", text: rule.vendorName }
}
