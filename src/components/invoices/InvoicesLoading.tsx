// Client component by import — only ever rendered from <InvoicesClient>.
import { Skeleton } from "@/components/ui/skeleton"
import { TABLE_GRID_COLUMNS } from "./constants"

export function InvoicesLoading() {
  return (
    <div
      className="grid items-center px-[18px] py-[13px] border-b border-[#F1F3F8]"
      style={{ gridTemplateColumns: TABLE_GRID_COLUMNS, gap: "12px" }}
    >
      <div className="flex items-center gap-[10px]">
        <Skeleton className="w-7 h-7 rounded-full bg-[#EEF1F8] shrink-0" />
        <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "62%" }} />
      </div>
      <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "70%" }} />
      <Skeleton className="h-3 bg-[#EEF1F8] ml-auto" style={{ width: "60%" }} />
      <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "50%" }} />
      <Skeleton className="h-[6px] rounded-full bg-[#EEF1F8]" style={{ width: "90%" }} />
      <Skeleton className="h-5 rounded-full bg-[#EEF1F8]" style={{ width: "64px" }} />
      <div />
    </div>
  )
}
