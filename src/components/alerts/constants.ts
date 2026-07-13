import {
  AlertTriangle,
  Clock,
  Plus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { type AlertFilter } from "@/api-types/alerts"

export const ALERT_ICON: Record<string, LucideIcon> = {
  AMOUNT_HIGH:       AlertTriangle,
  AMOUNT_LOW:        TrendingDown,
  SPEND_SPIKE:       TrendingUp,
  MISSING_RECURRING: Clock,
  NEW_VENDOR:        Plus,
}

export const CHIP_META: Record<AlertFilter, { label: string; activeBg: string; activeBorder: string; activeColor: string }> = {
  all:      { label: "All",      activeBg: "#EEF3FF", activeBorder: "#BFD3FF", activeColor: "#3B6FE0" },
  critical: { label: "Critical", activeBg: "#FEF2F2", activeBorder: "#FECACA", activeColor: "#DC2626" },
  warning:  { label: "Warning",  activeBg: "#FFFBEB", activeBorder: "#FDE68A", activeColor: "#B45309" },
  info:     { label: "Info",     activeBg: "#EFF6FF", activeBorder: "#BFDBFF", activeColor: "#2563EB" },
}
