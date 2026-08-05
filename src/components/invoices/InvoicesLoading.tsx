// Client component by import — only ever rendered from <InvoicesClient>.
import { Skeleton } from "@/components/ui/skeleton"
import { TABLE_GRID_COLUMNS } from "./constants"

export function InvoicesLoading() {
  return (
    <div
      className="grid items-center px-4.5 py-3 border-b border-hover"
      style={{ gridTemplateColumns: TABLE_GRID_COLUMNS, gap: "12px" }}
    >
      {/* Vendor */}
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-7 h-7 rounded-full bg-muted-strong shrink-0" />
        <Skeleton className="h-3 bg-muted-strong" style={{ width: "62%" }} />
      </div>
      <Skeleton className="h-3 bg-muted-strong" style={{ width: "70%" }} />
      <Skeleton className="h-3 bg-muted-strong ms-auto" style={{ width: "60%" }} />
      <Skeleton className="h-3 bg-muted-strong" style={{ width: "50%" }} />
      <Skeleton className="h-1.5 rounded-full bg-muted-strong" style={{ width: "90%" }} />
      <Skeleton className="h-5 rounded-full bg-muted-strong" style={{ width: "64px" }} />
      <div />
    </div>
  )
}
