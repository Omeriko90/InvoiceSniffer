// Client component by import — only ever rendered from the Alerts page.
import { BellOff } from "lucide-react"

export function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 max-w-[880px]">
      <div className="w-14 h-14 rounded-xl bg-[#F1F3F8] flex items-center justify-center mb-4">
        <BellOff size={26} strokeWidth={1.5} className="text-[#94A3B8]" />
      </div>
      <p className="text-[16px] font-[700] text-heading mb-2">
        {filtered ? "No alerts in this category" : "No alerts right now"}
      </p>
      <p className="text-[13.5px] text-text-secondary text-center max-w-[340px] leading-[1.6]">
        {filtered
          ? "Try a different severity filter — you're all caught up here."
          : "We'll flag unusual spend, spikes, missing recurring invoices, and new vendors as they come in."}
      </p>
    </div>
  )
}
