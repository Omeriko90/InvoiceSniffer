import { SignUpForm } from "./SignUpForm"
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader"
import { BrandPanel } from "@/components/auth/BrandPanel"

export default function SignUpPage() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* ── Left panel ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px", background: "#FAFBFF", minWidth: 0 }}>
        <div style={{ width: "100%", maxWidth: "380px" }} className="flex flex-col">

          <AuthBrandHeader />

          <h1 style={{ fontSize: "27px", fontWeight: 800, letterSpacing: "-0.02em", color: "#1E293B", margin: "0 0 6px" }}>Create your account</h1>
          <p style={{ fontSize: "14px", color: "#64748B", margin: "0 0 26px" }}>Start reconciling invoices in minutes.</p>

          <SignUpForm />

          <p className="text-[13.5px] text-[#64748B] text-center mt-[22px]">
            Already have an account?{" "}
            <a href="/auth/signin" className="text-primary font-[700] hover:opacity-80">Sign in</a>
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <BrandPanel />

    </div>
  )
}
