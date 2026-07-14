// Client component by import — only ever rendered from <ReconcileClient>.
import Link from "next/link"
import { GitMerge } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-14 h-14 rounded-xl bg-hover flex items-center justify-center mb-4">
        <GitMerge size={26} strokeWidth={1.5} className="text-dim" />
      </div>
      <p className="text-[16px] font-[700] text-heading mb-2">Nothing to reconcile yet</p>
      <p className="text-[13.5px] text-text-secondary text-center max-w-[340px] leading-[1.6] mb-6">
        Import a bank or credit-card CSV and we&apos;ll match every charge against your detected
        invoices automatically.
      </p>
      <Button
        nativeButton={false}
        render={<Link href="/reconcile" />}
        className="h-auto px-[18px] py-[10px] rounded-[10px] text-[13.5px] font-[700] text-white border-0"
        style={{
          background: "linear-gradient(135deg,#7AA7FF,#88D0FF)",
          boxShadow: "0 4px 12px rgba(122,167,255,.3)",
        }}
      >
        Import a CSV
      </Button>
    </div>
  )
}
