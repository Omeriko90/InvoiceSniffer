import { Mail } from "lucide-react"

export function AuthBrandHeader() {
  return (
    <div className="flex items-center gap-[10px] mb-8">
      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg,#7AA7FF,#A78BFA)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Mail size={19} strokeWidth={2} color="#fff" />
      </div>
      <span style={{ fontSize: "17px", fontWeight: 800, color: "#1E293B", letterSpacing: "-0.01em" }}>Reconcile</span>
    </div>
  )
}
