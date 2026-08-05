import { Check } from "lucide-react"
import { FEATURES } from "./constants"

export function BrandPanel() {
  return (
    <div className="flex-1 min-w-0 flex flex-col justify-center p-14 relative overflow-hidden bg-gradient-auth">
      <div style={{ position: "absolute", top: -80, right: -60, width: 280, height: 280, borderRadius: "9999px", background: "rgba(255,255,255,.12)" }} />
      <div style={{ position: "absolute", bottom: -100, left: -40, width: 240, height: 240, borderRadius: "9999px", background: "rgba(255,255,255,.08)" }} />
      <div className="relative text-white max-w-[440px]">
        <h2 style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25, margin: "0 0 16px" }}>
          Invoices in. Transactions matched. Books done.
        </h2>
        <p style={{ fontSize: "15.5px", lineHeight: 1.65, opacity: 0.92, margin: "0 0 32px" }}>
          Connect Gmail, upload a statement, and let InvoiceSniffer match every charge to its invoice — flagging anomalies and building your accountant export automatically.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {FEATURES.map((feat) => (
            <div key={feat} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Check size={16} strokeWidth={2.2} className="text-white" />
              </span>
              <span style={{ fontSize: "14.5px", fontWeight: 600 }}>{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
