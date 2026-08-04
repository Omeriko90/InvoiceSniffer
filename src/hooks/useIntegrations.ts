import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queries } from "@/queries"
import {
  connectIntegration,
  disconnectIntegration,
  updateIntegrationDirection,
  pushToIntegration,
} from "@/api/settings"
import { useSettings } from "@/hooks/useSettings"
import type { ConnectedIntegration } from "@/api-types/settings"

// All three mutations refresh the settings query so the Integrations section
// reflects the new connection/direction immediately.
function useSettingsInvalidator() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queries.settings.all.queryKey })
}

export function useConnectIntegration() {
  const invalidate = useSettingsInvalidator()
  return useMutation({ mutationFn: connectIntegration, onSuccess: invalidate })
}

export function useDisconnectIntegration() {
  const invalidate = useSettingsInvalidator()
  return useMutation({ mutationFn: disconnectIntegration, onSuccess: invalidate })
}

export function useUpdateIntegrationDirection() {
  const invalidate = useSettingsInvalidator()
  return useMutation({ mutationFn: updateIntegrationDirection, onSuccess: invalidate })
}

export function usePushToIntegration() {
  return useMutation({ mutationFn: pushToIntegration })
}

// The org's connected integrations that can currently receive a push (connector
// supports it AND the account's direction permits it). Drives the "Sync to X"
// action in the invoice drawer.
export function usePushableIntegrations(): ConnectedIntegration[] {
  const { data } = useSettings()
  return (data?.integrations.connected ?? []).filter(
    (c) =>
      c.connected &&
      c.capabilities.canPush &&
      (c.direction === "PUSH" || c.direction === "BOTH")
  )
}
