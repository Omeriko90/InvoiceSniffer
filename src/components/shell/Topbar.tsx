"use client"

import { GmailSyncPill } from "./GmailSyncPill"

type TopbarProps = {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-7 shrink-0">
      <h1 className="text-xl font-bold text-heading">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Gmail sync status pill — self-fetches; shows out-of-sync + reconnect */}
        <GmailSyncPill />
      </div>
    </header>
  )
}
