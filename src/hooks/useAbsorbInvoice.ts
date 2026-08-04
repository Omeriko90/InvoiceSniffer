import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queries } from "@/queries"
import { absorbInvoiceIntoFixedExpense } from "@/api/fixed-expenses"

// Attach an invoice to an existing fixed expense from the invoice drawer, teaching
// the expense the invoice's vendor title + sender so past & future invoices from
// that sender link too. The caller refreshes the invoice list on success.
export function useAbsorbInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: absorbInvoiceIntoFixedExpense,
    onSuccess: () => {
      toast.success("Invoice linked to fixed expense")
      queryClient.invalidateQueries({ queryKey: queries.fixedExpenses.list.queryKey })
    },
    onError: (error) => toast.error(error.message),
  })
}
