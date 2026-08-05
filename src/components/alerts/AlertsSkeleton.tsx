import { Skeleton } from "@/components/ui/skeleton"

// Card-shaped skeletons shown while alerts load (route-level and query-pending).
export function AlertsSkeleton() {
  return (
    <div className="flex flex-col gap-3 max-w-[880px]">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-border rounded-[12px] p-[16px_18px] flex gap-4 items-center"
          style={{ borderLeft: "4px solid #EEF1F8" }}
        >
          <Skeleton className="w-10 h-10 rounded-[11px] bg-muted-strong" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "35%" }} />
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "80%" }} />
          </div>
          <Skeleton className="h-8 bg-muted-strong" style={{ width: "56px" }} />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-7 rounded-[9px] bg-muted-strong" style={{ width: "72px" }} />
            <Skeleton className="h-7 rounded-[9px] bg-muted-strong" style={{ width: "72px" }} />
          </div>
        </div>
      ))}
    </div>
  )
}
