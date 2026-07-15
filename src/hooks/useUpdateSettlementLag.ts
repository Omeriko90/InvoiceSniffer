import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queries } from "@/queries"
import { updateSettlementLag } from "@/api/settings"

export function useUpdateSettlementLag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSettlementLag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queries.settings.all.queryKey }),
  })
}
