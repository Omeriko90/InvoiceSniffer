import type { RecStats } from "@/components/dashboard/types"

export const LEGEND = [
  { label: "Matched",    key: "matched"   as const, dotClass: "bg-success" },
  { label: "Possible",   key: "possible"  as const, dotClass: "bg-warning" },
  { label: "Missing",    key: "missing"   as const, dotClass: "bg-danger" },
  { label: "No invoice", key: "noInvoice" as const, dotClass: "bg-faint" },
] satisfies { label: string; key: keyof RecStats; dotClass: string }[]
