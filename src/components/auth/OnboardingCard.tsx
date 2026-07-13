import { Mail, Lock } from "lucide-react"
import Link from "next/link"
import { GoogleLogo } from "./GoogleLogo"

export function OnboardingCard() {
  return (
    <div
      className="w-full text-center flex flex-col items-center"
      style={{ maxWidth: "440px", background: "white", border: "1px solid #E8EDFA", borderRadius: "18px", boxShadow: "0 12px 40px rgba(80,110,180,.10)", padding: "36px 34px" }}
    >
      {/* Logo */}
      <div
        className="w-[54px] h-[54px] rounded-[14px] flex items-center justify-center mb-[18px]"
        style={{ background: "linear-gradient(135deg,#7AA7FF,#A78BFA)", boxShadow: "0 6px 18px rgba(122,167,255,.4)" }}
      >
        <Mail size={26} strokeWidth={2} color="#fff" />
      </div>

      <p className="text-[13px] font-[700] text-primary uppercase tracking-[0.12em] mb-2">
        Reconcile
      </p>

      <h1 className="text-[25px] font-[800] text-heading tracking-[-0.02em] mb-2">
        Connect your Gmail
      </h1>

      <p className="text-[14.5px] text-[#64748B] leading-[1.6] mb-[22px]">
        We scan your inbox for invoices &amp; receipts and store only the details — sender, amount, date, and a link back to the original email.{" "}
        <strong className="text-[#475569]">Your invoice files are never stored.</strong>
      </p>

      <Link
        href="/api/gmail/connect"
        className="w-full h-[46px] gap-[10px] text-[15px] font-[700] rounded-[11px] flex items-center justify-center text-white"
        style={{ background: "linear-gradient(135deg,#7AA7FF,#88D0FF)", boxShadow: "0 6px 16px rgba(122,167,255,.35)" }}
      >
        <GoogleLogo />
        Connect Gmail
      </Link>

      <div className="flex items-center justify-center gap-[7px] mt-4 text-[12.5px] text-[#94A3B8]">
        <Lock size={13} strokeWidth={1.5} className="shrink-0" />
        <span>Read-only access · encrypted · revoke anytime</span>
      </div>

      <Link href="/" className="mt-5 text-[13px] text-[#94A3B8] hover:text-[#64748B] transition-colors">
        Skip for now
      </Link>
    </div>
  )
}
