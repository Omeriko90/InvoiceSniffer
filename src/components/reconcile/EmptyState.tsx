// Client component by import — only ever rendered from <ReconcileClient>.
import Link from "next/link"
import { GitMerge } from "lucide-react"
import { EmptyState as EmptyStateShell } from "@/components/ui/empty-state"

export function EmptyState() {
  return (
    <EmptyStateShell
      icon={GitMerge}
      title="Nothing to reconcile yet"
      description="Import a bank or credit-card CSV and we'll match every charge against your detected invoices automatically."
      action={
        <Link
          href="/reconcile"
          className="inline-flex items-center justify-center h-auto px-[18px] py-[10px] rounded-[10px] text-[13.5px] font-[700] text-white border-0"
          style={{
            background: "linear-gradient(135deg,#7AA7FF,#88D0FF)",
            boxShadow: "0 4px 12px rgba(122,167,255,.3)",
          }}
        >
          Import a CSV
        </Link>
      }
    />
  )
}
