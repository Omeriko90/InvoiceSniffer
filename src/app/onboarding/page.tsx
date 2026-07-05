import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Mail, Lock } from "lucide-react"
import Link from "next/link"

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9z" fill="#4285F4"/>
      <path d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z" fill="#34A853"/>
      <path d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2a11 11 0 0 0 0 9.8l3.7-2.8z" fill="#FBBC05"/>
      <path d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2 7.1l3.7 2.8C6.6 7.3 9.1 5.4 12 5.4z" fill="#EA4335"/>
    </svg>
  )
}

export default async function OnboardingPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "radial-gradient(120% 120% at 50% -10%, #EEF3FF 0%, #FAFBFF 55%)" }}
    >
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

        <Link href="/dashboard" className="mt-5 text-[13px] text-[#94A3B8] hover:text-[#64748B] transition-colors">
          Skip for now
        </Link>
      </div>
    </div>
  )
}
