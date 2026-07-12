import { Skeleton } from "@/components/ui/skeleton"

const GRID = { gridTemplateColumns: ".7fr 1.5fr .8fr 1.7fr 1fr 1.6fr", gap: "14px" }

export default function Loading() {
  return (
    <div className="flex flex-col">
      <Skeleton className="h-[46px] w-[420px] rounded-[12px] bg-[#EEF1F8] mb-4" />
      <div className="bg-white border border-[#E8EDFA] rounded-[14px] overflow-hidden">
        <div className="grid px-[18px] py-[12px] bg-[#F8FAFF] border-b border-[#E8EDFA]" style={GRID}>
          {["Date", "Merchant", "Amount", "Matched invoice", "Confidence", "Actions"].map((h, i) => (
            <span
              key={h}
              className="text-[11.5px] font-[700] uppercase tracking-[0.04em] text-[#64748B]"
              style={i === 2 || i === 5 ? { textAlign: "right" } : undefined}
            >
              {h}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid items-center px-[18px] py-[14px] border-b border-[#F1F3F8]" style={GRID}>
            <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "60%" }} />
            <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "75%" }} />
            <Skeleton className="h-3 bg-[#EEF1F8] ml-auto" style={{ width: "55%" }} />
            <Skeleton className="h-3 bg-[#EEF1F8]" style={{ width: "80%" }} />
            <Skeleton className="h-5 rounded-full bg-[#EEF1F8]" style={{ width: "70px" }} />
            <Skeleton className="h-7 rounded-[8px] bg-[#EEF1F8] ml-auto" style={{ width: "140px" }} />
          </div>
        ))}
      </div>
    </div>
  )
}
