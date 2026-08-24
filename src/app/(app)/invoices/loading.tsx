import { Skeleton } from "@/components/ui/skeleton"
import { TABLE_GRID_COLUMNS } from "@/components/invoices/constants"

const HEADERS = ["Vendor", "Invoice #", "Issue date", "Received", "Category", "Amount", ""]

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-[320px] rounded-lg bg-muted-strong" />
        <Skeleton className="h-9 w-28 rounded-[10px] bg-muted-strong" />
        <Skeleton className="h-9 w-28 rounded-[10px] bg-muted-strong" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-24 rounded-lg bg-muted-strong" />
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div
          className="grid px-4.5 py-3 bg-background border-b border-border"
          style={{ gridTemplateColumns: TABLE_GRID_COLUMNS, gap: "12px" }}
        >
          {HEADERS.map((h, i) => (
            <span
              key={i}
              className="text-sm font-bold uppercase tracking-tight text-text-secondary"
            >
              {h}
            </span>
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid items-center px-4.5 py-3.5 border-b border-hover last:border-b-0"
            style={{ gridTemplateColumns: TABLE_GRID_COLUMNS, gap: "12px" }}
          >
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "75%" }} />
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "60%" }} />
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "70%" }} />
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "70%" }} />
            <Skeleton className="h-5 rounded-full bg-muted-strong" style={{ width: "68px" }} />
            <Skeleton className="h-3 bg-muted-strong ms-auto" style={{ width: "55%" }} />
            <span />
          </div>
        ))}
      </div>
    </div>
  )
}
