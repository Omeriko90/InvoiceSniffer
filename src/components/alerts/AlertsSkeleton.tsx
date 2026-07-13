import { Skeleton } from "@/components/ui/skeleton"

// Card-shaped skeletons shown while alerts load (route-level and query-pending).
export function AlertsSkeleton() {
  return (
    <div className="flex flex-col gap-[12px] max-w-[880px]">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-border rounded-[12px] p-[16px_18px] flex gap-[16px] items-center"
          style={{ borderLeft: "4px solid #EEF1F8" }}
        >
          <Skeleton className="w-[40px] h-[40px] rounded-[11px] bg-[#EEF1F8]" />
          <div className="flex-1 flex flex-col gap-[8px]">
            <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "35%" }} />
            <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "80%" }} />
          </div>
          <Skeleton className="h-8 bg-[#EEF1F8]" style={{ width: "56px" }} />
          <div className="flex flex-col gap-[6px]">
            <Skeleton className="h-7 rounded-[9px] bg-[#EEF1F8]" style={{ width: "72px" }} />
            <Skeleton className="h-7 rounded-[9px] bg-[#EEF1F8]" style={{ width: "72px" }} />
          </div>
        </div>
      ))}
    </div>
  )
}
