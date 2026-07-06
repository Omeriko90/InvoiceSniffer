"use client"

import Link from "next/link"
import { Upload, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type TopbarProps = {
  title: string
  gmailSyncedAt?: string | null
  gmailConnected?: boolean
}

export function Topbar({ title, gmailSyncedAt, gmailConnected = false }: TopbarProps) {
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-7 shrink-0">
      <h1 className="text-[19px] font-[700] text-heading">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Gmail sync status pill */}
        {gmailConnected && (
          <Badge className="h-auto gap-1.5 px-3 py-1.5 rounded-full bg-success-bg border-[#BBF7D0] text-[12px] font-[500] text-[#059669]">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            {gmailSyncedAt ? `Gmail synced · ${gmailSyncedAt}` : "Gmail synced"}
          </Badge>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-[13px]"
          nativeButton={false}
          render={<Link href="/import" />}
        >
          <Upload size={14} />
          Upload CSV
        </Button>

        <Button
          size="sm"
          className="gap-1.5 text-[13px] text-white shadow-primary border-0"
          style={{ background: "linear-gradient(135deg, #7AA7FF, #88D0FF)" }}
          nativeButton={false}
          render={<Link href="/exports" />}
        >
          <Download size={14} />
          New export
        </Button>
      </div>
    </header>
  )
}
