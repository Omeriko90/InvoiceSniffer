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

// Active-chip color classes (inactive state is a shared static class in FilterChips).
// `count` is applied to the count badge; `active` sets bg/border/text together.
export const CHIP_META: Record<AlertFilter, { label: string; active: string; count: string }> = {
  all:      { label: "All",      active: "bg-primary-soft border-info-border text-primary-strong", count: "text-primary-strong" },
  critical: { label: "Critical", active: "bg-danger-bg border-danger-border text-danger-fg",     count: "text-danger-fg" },
  warning:  { label: "Warning",  active: "bg-warning-bg border-warning-border text-warning-fg",   count: "text-warning-fg" },
  info:     { label: "Info",     active: "bg-info-bg border-info-border text-info-fg",            count: "text-info-fg" },
}
