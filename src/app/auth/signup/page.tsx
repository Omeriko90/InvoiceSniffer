import Link from "next/link"
import { SignUpForm } from "./SignUpForm"
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader"
import { BrandPanel } from "@/components/auth/BrandPanel"
import { getT } from "@/lib/i18n/getLocale.server"

export default async function SignUpPage() {
  const t = await getT()
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* ── Left panel ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px", background: "#FAFBFF", minWidth: 0 }}>
        <div style={{ width: "100%", maxWidth: "380px" }} className="flex flex-col">

          <AuthBrandHeader />

          <h1 style={{ fontSize: "27px", fontWeight: 800, letterSpacing: "-0.02em", color: "#1E293B", margin: "0 0 6px" }}>{t("auth.signup.title")}</h1>
          <p style={{ fontSize: "14px", color: "#64748B", margin: "0 0 26px" }}>{t("auth.signup.subtitle")}</p>

          <SignUpForm />

          <p className="text-sm text-text-secondary text-center mt-[22px]">
            {t("auth.signup.haveAccount")}{" "}
            <Link href="/auth/signin" className="text-primary font-bold hover:opacity-80">{t("auth.signup.signIn")}</Link>
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <BrandPanel />

    </div>
  )
}
