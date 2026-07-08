import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateInvoice } from "@/api/invoices"

export function useUpdateInvoice() {
  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: () => toast.success("Invoice updated"),
    onError: (error) => toast.error(error.message),
  })
}
