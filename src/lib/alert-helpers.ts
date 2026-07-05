export const ALERT_META: Record<string, { label: string; color: string; bg: string }> = {
  AMOUNT_HIGH:       { label: "High",       color: "#DC2626", bg: "#FEF2F2" },
  AMOUNT_LOW:        { label: "Low",        color: "#B45309", bg: "#FFFBEB" },
  SPEND_SPIKE:       { label: "Spike",      color: "#B45309", bg: "#FFFBEB" },
  MISSING_RECURRING: { label: "Missing",    color: "#B45309", bg: "#FFFBEB" },
  NEW_VENDOR:        { label: "New vendor", color: "#2563EB", bg: "#EFF6FF" },
}

export function alertDescription(type: string, details: Record<string, unknown>): string {
  switch (type) {
    case "AMOUNT_HIGH":       return `${details.actual} — ${details.pct ?? "above"} above median of ${details.expected}.`
    case "AMOUNT_LOW":        return `${details.actual} received, lower than usual.`
    case "SPEND_SPIKE":       return `May spend ${details.actual} vs ${details.expected} trailing avg.`
    case "MISSING_RECURRING": return `Recurring invoice not detected this month.`
    case "NEW_VENDOR":        return `First invoice from this vendor: ${details.actual}.`
    default:                  return "Review this alert."
  }
}
