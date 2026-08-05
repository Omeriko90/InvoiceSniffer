import { Mail } from "lucide-react"

export function AuthBrandHeader() {
  return (
    <div className="flex items-center gap-2.5 mb-8">
      <div className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0 bg-gradient-logo">
        <Mail size={19} strokeWidth={2} className="text-white" />
      </div>
      <span style={{ fontSize: "17px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.01em" }}>InvoiceSniffer</span>
    </div>
  )
}
