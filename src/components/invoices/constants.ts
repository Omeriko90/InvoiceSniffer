import type { StatusMeta } from "./types"

export const VENDOR_GRADIENTS = [
  "linear-gradient(135deg,#34D399,#22D3EE)",
  "linear-gradient(135deg,#FB7171,#A78BFA)",
  "linear-gradient(135deg,#FBBF24,#FB7171)",
  "linear-gradient(135deg,#334155,#64748B)",
  "linear-gradient(135deg,#7AA7FF,#A78BFA)",
  "linear-gradient(135deg,#A78BFA,#7AA7FF)",
  "linear-gradient(135deg,#22D3EE,#7AA7FF)",
]

export const STATUS_META: Record<string, StatusMeta> = {
  MATCHED:   { label: "Confirmed",  badge: "bg-success-bg text-success-fg" },
  UNMATCHED: { label: "Review",     badge: "bg-danger-bg text-danger-fg" },
  DETECTED:  { label: "Detected",   badge: "bg-info-bg text-info-fg" },
  REVIEWED:  { label: "Reviewed",   badge: "bg-purple-bg text-purple-fg" },
  IGNORED:   { label: "Ignored",    badge: "bg-hover text-dim" },
}

export const TABLE_GRID_COLUMNS = "1.5fr 0.9fr 0.75fr 0.75fr 0.95fr 0.8fr 40px"
