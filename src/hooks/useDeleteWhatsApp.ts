import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queries } from "@/queries"
import { deleteWhatsApp } from "@/api/settings"

export function useDeleteWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteWhatsApp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queries.settings.all.queryKey }),
  })
}
