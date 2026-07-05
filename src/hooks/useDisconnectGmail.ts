import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queries } from "@/queries"
import { disconnectGmail } from "@/api/settings"

export function useDisconnectGmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disconnectGmail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queries.settings.all.queryKey }),
  })
}
