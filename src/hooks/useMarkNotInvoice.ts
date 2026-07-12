import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { markNotInvoice } from "@/api/invoices"

export function useMarkNotInvoice() {
  return useMutation({
    mutationFn: markNotInvoice,
    onSuccess: () =>
      toast.success("Marked as not an invoice", {
        description: "Similar emails from this sender are now less likely to be detected. Manage in Settings → Learned rules.",
      }),
    onError: (error) => toast.error(error.message),
  })
}
