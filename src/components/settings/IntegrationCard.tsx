// Client component by import — only ever rendered from <SettingsPage>.
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDownToLine, ArrowUpFromLine, Check, Loader2 } from "lucide-react"
import type {
  ConnectedIntegration,
  IntegrationCapabilities,
  IntegrationCatalogEntry,
  IntegrationDirection,
} from "@/api-types/settings"
import {
  useConnectIntegration,
  useDisconnectIntegration,
  useUpdateIntegrationDirection,
} from "@/hooks/useIntegrations"

interface IntegrationCardProps {
  entry: IntegrationCatalogEntry
  connected: ConnectedIntegration | undefined
  atLimit: boolean
}

const DIRECTION_LABELS: Record<IntegrationDirection, string> = {
  PULL: "Import expenses",
  PUSH: "Export bookkeeping",
  BOTH: "Both",
}

// Which directions the connector's capabilities permit — used to disable
// unsupported options in the picker.
function allowedDirections(caps: IntegrationCapabilities): IntegrationDirection[] {
  const out: IntegrationDirection[] = []
  if (caps.canPull) out.push("PULL")
  if (caps.canPush) out.push("PUSH")
  if (caps.canPull && caps.canPush) out.push("BOTH")
  return out
}

export function IntegrationCard({ entry, connected, atLimit }: IntegrationCardProps) {
  const connect = useConnectIntegration()
  const disconnect = useDisconnectIntegration()
  const updateDirection = useUpdateIntegrationDirection()

  const isConnected = Boolean(connected?.connected)
  const allowed = allowedDirections(entry.capabilities)
  const [apiId, setApiId] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [direction, setDirection] = useState<IntegrationDirection>(allowed[allowed.length - 1] ?? "PULL")

  const handleConnect = () => {
    if (entry.authKind === "oauth2") {
      window.location.href = `/api/integrations/${entry.provider.toLowerCase()}/connect`
      return
    }
    connect.mutate({
      provider: entry.provider,
      credentials: { id: apiId, secret: apiSecret },
      direction,
    })
  }

  return (
    <div className="rounded-[12px] border border-border bg-background px-4 py-[14px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14.5px] font-[700] text-heading">{entry.name}</p>
            <CapabilityBadges caps={entry.capabilities} />
          </div>
          <p className="text-[12.5px] text-text-secondary mt-[2px]">
            {isConnected
              ? connected?.lastPulledAt
                ? `Last synced ${new Date(connected.lastPulledAt).toLocaleDateString()}`
                : "Connected"
              : entry.region === "IL"
                ? "Israeli invoicing platform"
                : "Accounting platform"}
          </p>
        </div>
        {isConnected ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-[600] text-success">
            <Check size={14} strokeWidth={2.5} /> Connected
          </span>
        ) : null}
      </div>

      {!entry.implemented ? (
        <p className="mt-[10px] text-[12.5px] text-dim">Coming soon</p>
      ) : isConnected ? (
        <div className="mt-[12px] flex flex-col gap-[10px]">
          <DirectionPicker
            value={connected!.direction}
            allowed={allowed}
            disabled={updateDirection.isPending}
            onChange={(d) =>
              updateDirection.mutate({
                provider: entry.provider,
                credentialId: connected!.id,
                direction: d,
              })
            }
          />
          <Button
            variant="outline"
            onClick={() =>
              disconnect.mutate({ provider: entry.provider, credentialId: connected!.id })
            }
            disabled={disconnect.isPending}
            className="self-start h-auto text-[13px] font-[600] text-danger bg-surface border-border rounded-[9px] px-[14px] py-[7px] hover:bg-hover"
          >
            Disconnect
          </Button>
        </div>
      ) : atLimit ? (
        <p className="mt-[10px] text-[12.5px] text-text-secondary">
          You&apos;ve reached your plan&apos;s integration limit.
        </p>
      ) : (
        <div className="mt-[12px] flex flex-col gap-[10px]">
          {entry.authKind === "apiKey" ? (
            <>
              <Input
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                placeholder="API key ID"
                className="h-auto text-[13px] rounded-[9px]"
              />
              <Input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="API secret"
                className="h-auto text-[13px] rounded-[9px]"
              />
              <DirectionPicker value={direction} allowed={allowed} onChange={setDirection} />
            </>
          ) : null}
          {connect.isError ? (
            <p className="text-[12px] text-danger">{(connect.error as Error).message}</p>
          ) : null}
          <Button
            onClick={handleConnect}
            disabled={
              connect.isPending || (entry.authKind === "apiKey" && (!apiId.trim() || !apiSecret.trim()))
            }
            className="self-start h-auto text-[13px] font-[600] text-white bg-primary rounded-[9px] px-[14px] py-[7px] shadow-primary hover:bg-primary hover:opacity-90"
          >
            {connect.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Connect
          </Button>
        </div>
      )}
    </div>
  )
}

// Small Pull / Push affordance badges reflecting what the connector supports.
function CapabilityBadges({ caps }: { caps: IntegrationCapabilities }) {
  return (
    <span className="flex items-center gap-1">
      {caps.canPull ? (
        <span
          title="Imports expenses"
          className="inline-flex items-center gap-[3px] rounded-full bg-hover px-[7px] py-[2px] text-[10.5px] font-[600] text-text-secondary"
        >
          <ArrowDownToLine size={11} strokeWidth={2} /> Pull
        </span>
      ) : null}
      {caps.canPush ? (
        <span
          title="Exports bookkeeping"
          className="inline-flex items-center gap-[3px] rounded-full bg-hover px-[7px] py-[2px] text-[10.5px] font-[600] text-text-secondary"
        >
          <ArrowUpFromLine size={11} strokeWidth={2} /> Push
        </span>
      ) : null}
    </span>
  )
}

// Segmented direction control. Options the connector can't do are hidden (only
// `allowed` are rendered), so a pull-only provider shows a single option.
function DirectionPicker({
  value,
  allowed,
  disabled,
  onChange,
}: {
  value: IntegrationDirection
  allowed: IntegrationDirection[]
  disabled?: boolean
  onChange: (d: IntegrationDirection) => void
}) {
  if (allowed.length <= 1) return null
  return (
    <div className="inline-flex self-start rounded-[9px] border border-border bg-surface p-[3px]">
      {allowed.map((d) => {
        const active = d === value
        return (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => onChange(d)}
            className={
              "rounded-[7px] px-[10px] py-[5px] text-[12px] font-[600] transition-colors " +
              (active
                ? "bg-primary text-white shadow-primary"
                : "text-text-secondary hover:bg-hover")
            }
          >
            {DIRECTION_LABELS[d]}
          </button>
        )
      })}
    </div>
  )
}
