"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useDisconnectGmail } from "@/hooks/useDisconnectGmail"
import { useT } from "@/components/i18n/LocaleProvider"
import type { GmailConnection } from "@/api-types/settings"
import { GoogleGlyph } from "./GoogleGlyph"
import { ConnectedAccountPanel } from "./ConnectedAccountPanel"

interface GmailConnectionCardProps {
  gmails: GmailConnection[]
  maxGmailAccounts: number
}

export function GmailConnectionCard({ gmails, maxGmailAccounts }: GmailConnectionCardProps) {
  const t = useT()
  const disconnect = useDisconnectGmail()

  // Only *connected* mailboxes count against the plan cap — mirrors the
  // enforcement in the OAuth callback. A soft-disconnected account is free to
  // reconnect and never consumes a slot.
  const connectedCount = gmails.filter((g) => g.connected).length
  const atLimit = connectedCount >= maxGmailAccounts

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <h2 className="text-base font-bold text-heading leading-none mb-[18px]">{t("settings.gmail.title")}</h2>

        {gmails.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {gmails.map((gmail) => (
              <ConnectedAccountPanel
                key={gmail.id}
                gmail={gmail}
                onDisconnect={() => disconnect.mutate(gmail.id)}
                disconnecting={disconnect.isPending && disconnect.variables === gmail.id}
              />
            ))}
            {atLimit ? (
              <p className="self-start text-xs text-text-secondary mt-0.5">
                {t("settings.gmail.limitReached", { count: maxGmailAccounts })}
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { window.location.href = "/api/gmail/connect" }}
                className="self-start"
              >
                {t("settings.gmail.addAccount")}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[12px] border border-border bg-hover px-4 py-3.5">
            <GoogleGlyph />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-heading">{t("settings.gmail.notConnected")}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {t("settings.gmail.notConnectedHint")}
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => { window.location.href = "/api/gmail/connect" }}
            >
              {t("settings.gmail.connect")}
            </Button>
          </div>
        )}

        <div className="mt-3.5 rounded-[12px] border border-border bg-background px-4 py-3.5">
          <p className="text-sm text-text-secondary leading-[1.55]">
            {t("settings.gmail.privacyNote")}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
