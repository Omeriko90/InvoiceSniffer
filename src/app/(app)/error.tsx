"use client"

// Route-segment error boundary for all authenticated app pages. Catches
// render/data errors so a single failing query no longer blanks the page.
import { useEffect } from "react"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <div className="w-14 h-14 rounded-xl bg-danger-bg flex items-center justify-center mb-4">
        <TriangleAlert size={26} strokeWidth={1.5} className="text-danger" />
      </div>
      <p className="text-[16px] font-[700] text-heading mb-2">Something went wrong</p>
      <p className="text-[13.5px] text-text-secondary text-center max-w-[360px] leading-[1.6] mb-6">
        This page hit an unexpected error and couldn&apos;t load. You can try again — if it keeps
        happening, the issue has been logged.
      </p>
      <div className="flex items-center gap-[10px]">
        <Button
          onClick={unstable_retry}
          className="h-auto px-[18px] py-[10px] rounded-[10px] text-[13.5px] font-[700] text-white border-0"
          style={{
            background: "linear-gradient(135deg,#7AA7FF,#88D0FF)",
            boxShadow: "0 4px 12px rgba(122,167,255,.3)",
          }}
        >
          Try again
        </Button>
      </div>
      {error.digest && (
        <p className="mt-4 text-[11px] font-mono text-dim">Ref: {error.digest}</p>
      )}
    </div>
  )
}
