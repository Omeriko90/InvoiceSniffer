"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useDisconnectGmail } from "@/hooks/useDisconnectGmail"
import type { GmailConnection } from "@/api-types/settings"
import { ConnectedAccountPanel } from "./ConnectedAccountPanel"

interface GmailConnectionCardProps {
  gmail: GmailConnection
}

export function GmailConnectionCard({ gmail }: GmailConnectionCardProps) {
  const disconnect = useDisconnectGmail()

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <h2 className="text-[16px] font-[700] text-heading leading-none mb-[18px]">Gmail connection</h2>

        <ConnectedAccountPanel
          gmail={gmail}
          onDisconnect={() => disconnect.mutate()}
          disconnecting={disconnect.isPending}
        />

        <div className="mt-[14px] rounded-[12px] border border-border bg-background px-4 py-[14px]">
          <p className="text-[13px] text-text-secondary leading-[1.55]">
            Invoice files are never stored. We keep sender, subject, amount, date and a link to the
            original email — files are downloaded only during an export, then deleted.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
