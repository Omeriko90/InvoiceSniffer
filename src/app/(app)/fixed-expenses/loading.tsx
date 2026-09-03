import { Skeleton } from "@/components/ui/skeleton"

const GRID = "1.4fr 1.2fr 1fr 0.9fr 0.9fr 0.9fr"
const HEADERS = ["Name", "Source", "Category", "Frequency", "Expected", "This period"]

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-[320px] rounded-lg bg-muted-strong" />
        <Skeleton className="h-9 w-30 rounded-[10px] bg-muted-strong" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-44 rounded-lg bg-muted-strong" />
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div
          className="grid px-4.5 py-3 bg-background border-b border-border"
          style={{ gridTemplateColumns: GRID, gap: "12px" }}
        >
          {HEADERS.map((h) => (
            <span key={h} className="text-xs font-bold text-text-secondary">
              {h}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid items-center px-4.5 py-3 border-b border-hover last:border-b-0"
            style={{ gridTemplateColumns: GRID, gap: "12px" }}
          >
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "70%" }} />
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "80%" }} />
            <Skeleton className="h-5 rounded-full bg-muted-strong" style={{ width: "72px" }} />
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "60%" }} />
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "55%" }} />
            <Skeleton className="h-5 rounded-full bg-muted-strong" style={{ width: "80px" }} />
          </div>
        ))}
      </div>
    </div>
  )
}
