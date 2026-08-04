// Client component by import — only ever rendered from <SettingsPage>.
import { Card, CardContent } from "@/components/ui/card"
import type { IntegrationsData } from "@/api-types/settings"
import { IntegrationCard } from "./IntegrationCard"

interface IntegrationsSectionProps {
  integrations: IntegrationsData
}

export function IntegrationsSection({ integrations }: IntegrationsSectionProps) {
  const byProvider = new Map(integrations.connected.map((c) => [c.provider, c]))
  const connectedCount = integrations.connected.filter((c) => c.connected).length
  const atLimit = connectedCount >= integrations.maxIntegrations

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <h2 className="text-[16px] font-[700] text-heading leading-none mb-[4px]">
          Accounting integrations
        </h2>
        <p className="text-[12.5px] text-text-secondary mb-[18px]">
          Import expenses from your accounting platform, and export reconciled invoices back for
          bookkeeping.
        </p>

        <div className="grid grid-cols-2 gap-[10px]">
          {integrations.catalog.map((entry) => (
            <IntegrationCard
              key={entry.provider}
              entry={entry}
              connected={byProvider.get(entry.provider)}
              atLimit={atLimit}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
