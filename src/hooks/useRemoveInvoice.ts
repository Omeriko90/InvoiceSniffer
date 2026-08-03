import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { removeInvoice, restoreInvoice } from "@/api/invoices"

// Soft-removes an invoice and shows an "Undo" toast that restores it. `onChanged`
// is invoked after both the remove and a subsequent undo so the caller can
// refresh the list (e.g. router.refresh()).
export function useRemoveInvoice(onChanged?: () => void) {
  return useMutation({
    mutationFn: removeInvoice,
    onSuccess: (_data, { id, reason }) => {
      toast.success("Removed", {
        description:
          reason === "NOT_AN_INVOICE"
            ? "Similar emails from this sender are now less likely to be detected. Manage in Settings → Learned rules."
            : undefined,
        action: {
          label: "Undo",
          onClick: () => {
            restoreInvoice(id)
              .then(() => {
                toast.success("Restored")
                onChanged?.()
              })
              .catch((error) =>
                toast.error(error instanceof Error ? error.message : "Failed to restore invoice")
              )
          },
        },
      })
    },
    onError: (error) => toast.error(error.message),
  })
}
