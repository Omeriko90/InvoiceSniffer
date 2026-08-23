import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queries } from "@/queries"
import { updateDisplayCurrency } from "@/api/settings"

export function useUpdateDisplayCurrency() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateDisplayCurrency,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queries.settings.all.queryKey }),
  })
}
