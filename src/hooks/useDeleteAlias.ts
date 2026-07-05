import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queries } from "@/queries"
import { deleteAlias } from "@/api/settings"

export function useDeleteAlias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAlias,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queries.settings.all.queryKey }),
  })
}
