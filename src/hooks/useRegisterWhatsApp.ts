import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queries } from "@/queries"
import { registerWhatsApp } from "@/api/settings"

export function useRegisterWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: registerWhatsApp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queries.settings.all.queryKey }),
  })
}
