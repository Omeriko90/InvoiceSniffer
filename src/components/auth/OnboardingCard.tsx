import { Mail, Lock } from "lucide-react"
import Link from "next/link"
import { GoogleLogo } from "./GoogleLogo"

export function OnboardingCard() {
  return (
    <div className="w-full text-center flex flex-col items-center max-w-110 bg-surface border border-border rounded-lg shadow-card py-9 px-8.5">
      {/* Logo */}
      <div
        className="w-13.5 h-13.5 rounded-[14px] flex items-center justify-center mb-4.5 bg-gradient-logo shadow-logo"
      >
        <Mail size={26} strokeWidth={2} className="text-white" />
      </div>

      <p className="text-sm font-bold text-primary mb-2">
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
