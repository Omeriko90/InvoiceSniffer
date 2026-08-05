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
        <Skeleton className="w-7 h-7 rounded-full bg-[#EEF1F8] shrink-0" />
        <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "62%" }} />
      </div>
      {/* Invoice # */}
      <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "70%" }} />
      {/* Issue date */}
      <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "50%" }} />
      {/* Received */}
      <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "50%" }} />
      {/* Status */}
      <Skeleton className="h-5 rounded-full bg-[#EEF1F8]" style={{ width: "64px" }} />
      {/* Category */}
      <Skeleton className="h-5 rounded-full bg-[#EEF1F8]" style={{ width: "64px" }} />
      {/* Amount */}
      <Skeleton className="h-3 bg-[#EEF1F8] ml-auto" style={{ width: "60%" }} />
      {/* Gmail link */}
      <div />
    </div>
  )
}
