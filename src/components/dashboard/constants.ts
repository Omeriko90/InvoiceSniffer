import type { RecStats } from "@/components/dashboard/types"

export const LEGEND = [
  { label: "Matched",    key: "matched"   as const, color: "#34D399" },
  { label: "Possible",   key: "possible"  as const, color: "#FBBF24" },
  { label: "Missing",    key: "missing"   as const, color: "#FB7171" },
  { label: "No invoice", key: "noInvoice" as const, color: "#CBD5E1" },
] satisfies { label: string; key: keyof RecStats; color: string }[]
