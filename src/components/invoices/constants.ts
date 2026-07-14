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
  MATCHED:   { label: "Confirmed",  bg: "#ECFDF5", color: "#059669" },
  UNMATCHED: { label: "Review",     bg: "#FEF2F2", color: "#DC2626" },
  DETECTED:  { label: "Detected",   bg: "#EFF6FF", color: "#2563EB" },
  REVIEWED:  { label: "Reviewed",   bg: "#F5F3FF", color: "#7C3AED" },
  IGNORED:   { label: "Ignored",    bg: "#F1F3F8", color: "#94A3B8" },
}

export const STATUS_OPTIONS = [
  { value: "all",      label: "All" },
  { value: "DETECTED", label: "Detected" },
  { value: "MATCHED",  label: "Confirmed" },
  { value: "UNMATCHED",label: "Review" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "IGNORED",  label: "Ignored" },
]

export const TABLE_GRID_COLUMNS = "1.6fr 1fr 0.8fr 0.7fr 1.1fr 0.9fr 40px"
