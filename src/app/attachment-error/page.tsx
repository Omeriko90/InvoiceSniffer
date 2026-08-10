import type { Metadata } from "next"
import Link from "next/link"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resolveAttachmentError } from "@/lib/attachment-error"

// Standalone page shown when an invoice attachment can't be streamed. The
// attachment route opens in its own browser tab, so on failure it redirects
// here with a ?reason= code instead of returning a raw error.
type PageProps = { searchParams: Promise<{ reason?: string }> }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { reason } = await searchParams
  return { title: resolveAttachmentError(reason).heading }
}

export default async function AttachmentErrorPage({ searchParams }: PageProps) {
  const { reason } = await searchParams
  const variant = resolveAttachmentError(reason)
  // /api/* targets need a full navigation, so render a plain anchor there and
  // the client-side Link for in-app routes.
  const external = variant.href.startsWith("/api/")

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-[440px] rounded-lg border border-border bg-surface p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-warning-bg text-warning">
          <TriangleAlert size={24} strokeWidth={2} />
        </div>
        <h1 className="mb-2 text-[17px] font-bold text-heading">{variant.heading}</h1>
        <p className="mb-5 text-[13.5px] leading-[1.55] text-text-secondary">{variant.message}</p>
        <Button
          nativeButton={false}
          render={external ? <a href={variant.href} /> : <Link href={variant.href} />}
        >
          {variant.cta}
        </Button>
      </div>
    </main>
  )
}
