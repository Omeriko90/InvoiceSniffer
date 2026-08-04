import type { Metadata } from "next"
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { QueryProvider } from "@/components/shared/QueryProvider"
import { Toaster } from "@/components/ui/sonner"
import { LocaleProvider } from "@/components/i18n/LocaleProvider"
import { getLocale } from "@/lib/i18n/getLocale.server"
import { dirForLocale } from "@/lib/i18n/config"

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "InvoiceSniffer",
  description: "Manage invoices from email and reconcile against bank transactions",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html
      lang={locale}
      dir={dirForLocale(locale)}
      className={cn("h-full", sans.variable, mono.variable)}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <LocaleProvider initialLocale={locale}>
          <QueryProvider>{children}</QueryProvider>
        </LocaleProvider>
        <Toaster />
      </body>
    </html>
  )
}
