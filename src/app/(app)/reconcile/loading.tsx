import { Skeleton } from "@/components/ui/skeleton"

const GRID = { gridTemplateColumns: ".7fr 1.5fr .8fr 1.7fr 1fr 1.6fr", gap: "14px" }

export default function Loading() {
  return (
    <div className="flex flex-col">
      <Skeleton className="h-[46px] w-[420px] rounded-[12px] bg-muted-strong mb-4" />
      <div className="bg-white border border-border rounded-[14px] overflow-hidden">
        <div className="grid px-[18px] py-3 bg-raised border-b border-border" style={GRID}>
          {["Date", "Merchant", "Amount", "Matched invoice", "Confidence", "Actions"].map((h, i) => (
            <span
              key={h}
              className="text-xs font-bold text-text-secondary"
              style={i === 2 || i === 5 ? { textAlign: "right" } : undefined}
            >
              {h}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid items-center px-[18px] py-3.5 border-b border-hover" style={GRID}>
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "60%" }} />
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "75%" }} />
            <Skeleton className="h-3 bg-muted-strong ms-auto" style={{ width: "55%" }} />
            <Skeleton className="h-3 bg-muted-strong" style={{ width: "80%" }} />
            <Skeleton className="h-5 rounded-full bg-muted-strong" style={{ width: "70px" }} />
            <Skeleton className="h-7 rounded-[8px] bg-muted-strong ms-auto" style={{ width: "140px" }} />
          </div>
        ))}
      </div>
    </div>
  )
}
