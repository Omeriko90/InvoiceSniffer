"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useDisconnectGmail } from "@/hooks/useDisconnectGmail"
import type { GmailConnection } from "@/api-types/settings"
import { GoogleGlyph } from "./GoogleGlyph"
import { ConnectedAccountPanel } from "./ConnectedAccountPanel"

interface GmailConnectionCardProps {
  gmails: GmailConnection[]
}

export function GmailConnectionCard({ gmails }: GmailConnectionCardProps) {
  const disconnect = useDisconnectGmail()

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <h2 className="text-[16px] font-[700] text-heading leading-none mb-[18px]">Gmail connection</h2>

        {gmails.length > 0 ? (
          <div className="flex flex-col gap-[10px]">
            {gmails.map((gmail) => (
              <ConnectedAccountPanel
                key={gmail.id}
                gmail={gmail}
                onDisconnect={() => disconnect.mutate(gmail.id)}
                disconnecting={disconnect.isPending && disconnect.variables === gmail.id}
              />
            ))}
            <Button
              variant="outline"
              onClick={() => { window.location.href = "/api/gmail/connect" }}
              className="self-start h-auto text-[13px] font-[600] text-primary bg-surface border-border rounded-[9px] px-[14px] py-[7px] hover:bg-hover"
            >
              + Add account
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[12px] border border-border bg-hover px-4 py-[14px]">
            <GoogleGlyph />
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-[700] text-heading">Not connected</p>
              <p className="text-[12.5px] text-text-secondary mt-[2px]">
                Connect Gmail to detect invoices automatically
              </p>
            </div>
            <Button
              className="shrink-0 h-auto text-[13px] font-[600] text-white bg-primary rounded-[9px] px-[14px] py-[7px] shadow-primary hover:bg-primary hover:opacity-90"
              onClick={() => { window.location.href = "/api/gmail/connect" }}
            >
              Connect
            </Button>
          </div>
        )}

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
