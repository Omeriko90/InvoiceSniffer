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
        className="w-13.5 h-13.5 rounded-lg flex items-center justify-center mb-4.5"
        style={{ background: "linear-gradient(135deg,#7AA7FF,#A78BFA)", boxShadow: "0 6px 18px rgba(122,167,255,.4)" }}
      >
        <Mail size={26} strokeWidth={2} color="#fff" />
      </div>

      <p className="text-sm font-bold text-primary uppercase tracking-wide mb-2">
        InvoiceSniffer
      </p>

      <h1 className="text-2xl font-extrabold text-heading tracking-[-0.02em] mb-2">
        Connect your Gmail
      </h1>

      <p className="text-sm text-text-secondary leading-relaxed mb-5.5">
        We scan your inbox for invoices &amp; receipts and store only the details — sender, amount, date, and a link back to the original email.{" "}
        <strong className="text-subtle">Your invoice files are never stored.</strong>
      </p>

      <Link
        href="/api/gmail/connect"
        className="w-full h-11.5 gap-2.5 text-base font-bold rounded-lg flex items-center justify-center text-white"
        style={{ background: "linear-gradient(135deg,#7AA7FF,#88D0FF)", boxShadow: "0 6px 16px rgba(122,167,255,.35)" }}
      >
        <GoogleLogo />
        Connect Gmail
      </Link>

      <div className="flex items-center justify-center gap-1.75 mt-1 text-xs text-dim">
        <Lock size={13} strokeWidth={1.5} className="shrink-0" />
        <span>Read-only access · encrypted · revoke anytime</span>
      </div>

      <Link href="/" className="mt-5 text-sm text-dim hover:text-text-secondary transition-colors">
        Skip for now
      </Link>
    </div>
  )
}
