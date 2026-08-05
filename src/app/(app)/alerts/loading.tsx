import { Skeleton } from "@/components/ui/skeleton"
import { AlertsSkeleton } from "@/components/alerts/AlertsSkeleton"

export default function Loading() {
  return (
    <div className="flex flex-col">
      <div className="flex gap-2 mb-[18px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[34px] rounded-[10px] bg-muted-strong" style={{ width: "88px" }} />
        ))}
      </div>
      <AlertsSkeleton />
    </div>
  )
}
