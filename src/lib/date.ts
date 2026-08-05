import { format } from "date-fns"

// Shared date formatting so "MMM d, yyyy" / "MMM d" aren't re-typed everywhere.
export function fmtDate(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy")
}

export function fmtDateShort(iso: string): string {
  return format(new Date(iso), "MMM d")
}
