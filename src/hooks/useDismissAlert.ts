import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queries } from "@/queries"
import { dismissAlert } from "@/api/alerts"

export function useDismissAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dismissAlert,
    // Invalidate the whole alerts namespace so every severity view + the
    // dashboard's open-alert count refetch after a dismissal.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queries.alerts._def })
      queryClient.invalidateQueries({ queryKey: queries.dashboard._def })
      toast.success("Alert dismissed")
    },
    onError: (error) => toast.error(error.message),
  })
}
