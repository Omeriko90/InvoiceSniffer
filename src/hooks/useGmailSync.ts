import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { triggerGmailSync } from "@/api/gmail"

export function useGmailSync() {
  return useMutation({
    mutationFn: triggerGmailSync,
    onSuccess: () =>
      toast.success("Gmail sync started", {
        description: "Detected invoices will appear here shortly.",
      }),
    onError: (error) => toast.error(error.message),
  })
}
