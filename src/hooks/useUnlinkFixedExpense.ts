import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { unlinkFixedExpense } from "@/api/invoices"

// Detach an invoice from its fixed expense. `onChanged` runs after success so the
// caller can refresh the list / close the drawer (e.g. router.refresh()).
export function useUnlinkFixedExpense(onChanged?: () => void) {
  return useMutation({
    mutationFn: unlinkFixedExpense,
    onSuccess: () => {
      toast.success("Removed from fixed expense")
      onChanged?.()
    },
    onError: (error) => toast.error(error.message),
  })
}
