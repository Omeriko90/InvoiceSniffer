import { Skeleton } from "@/components/ui/skeleton"
import { AlertsSkeleton } from "@/components/alerts/AlertsSkeleton"

export default function Loading() {
  return (
    <div className="flex flex-col">
      <div className="flex gap-[8px] mb-[18px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[34px] rounded-[10px] bg-[#EEF1F8]" style={{ width: "88px" }} />
        ))}
      </div>
      <AlertsSkeleton />
    </div>
  )
}
