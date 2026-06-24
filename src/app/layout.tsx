import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "InvoiceSniffer",
  description: "Manage invoices from email and reconcile against bank transactions",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${font.variable} h-full`}>
      <body className="min-h-full bg-background text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
