"use client"

import { formatDistanceToNowStrict } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { useDisconnectGmail } from "@/hooks/useDisconnectGmail"
import type { GmailConnection } from "@/api-types/settings"

interface GmailConnectionCardProps {
  gmail: GmailConnection
}

// "4 minutes" → "4m", matching the compact style used across the app
function syncedLabel(lastSyncedAt: string | null): string {
  if (!lastSyncedAt) return "not synced yet"
  const distance = formatDistanceToNowStrict(new Date(lastSyncedAt))
    .replace(/ seconds?/, "s")
    .replace(/ minutes?/, "m")
    .replace(/ hours?/, "h")
    .replace(/ days?/, "d")
    .replace(/ months?/, "mo")
    .replace(/ years?/, "y")
  return `synced ${distance} ago`
}

export function GmailConnectionCard({ gmail }: GmailConnectionCardProps) {
  const disconnect = useDisconnectGmail()

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <h2 className="text-[16px] font-[700] text-heading leading-none mb-[18px]">Gmail connection</h2>

        {gmail.connected ? (
          <div className="flex items-center gap-3 rounded-[12px] border border-[#BBE7CD] bg-success-bg px-4 py-[14px]">
            <GoogleGlyph />
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-[700] text-heading truncate">{gmail.email}</p>
              <p className="text-[12.5px] text-[#059669] mt-[2px]">
                Connected · read-only · {syncedLabel(gmail.lastSyncedAt)}
              </p>
            </div>
            <button
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
              className="shrink-0 text-[13px] font-[600] text-danger bg-surface border border-[#FECACA] rounded-[9px] px-[14px] py-[7px] hover:bg-danger-bg transition-colors disabled:opacity-60"
            >
              {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
            </button>
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
            <a
              href="/api/gmail/connect"
              className="shrink-0 text-[13px] font-[600] text-white bg-primary rounded-[9px] px-[14px] py-[7px] shadow-primary hover:opacity-90 transition-opacity"
            >
              Connect
            </a>
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

function GoogleGlyph() {
  return (
    <div className="w-[34px] h-[34px] rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
      <svg width="17" height="17" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    </div>
  )
}
