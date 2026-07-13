"use client"

import { GmailSyncPill } from "./GmailSyncPill"
import { UploadCsvButton, NewExportButton } from "./TopbarActions"

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
        {gmailConnected && <GmailSyncPill gmailSyncedAt={gmailSyncedAt} />}

        <UploadCsvButton />
        <NewExportButton />
      </div>
    </header>
  )
}
