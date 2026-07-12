import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { transactionAction } from "@/api/reconcile"

const SUCCESS_MESSAGES: Record<string, string> = {
  confirm: "Match confirmed",
  reject: "Match rejected",
  no_invoice: "Marked as no invoice required",
  undo: "Reverted",
  link: "Invoice linked — alias learned",
}

export function useTransactionAction() {
  const router = useRouter()
  return useMutation({
    mutationFn: transactionAction,
    onSuccess: (_data, variables) => {
      toast.success(SUCCESS_MESSAGES[variables.action])
      router.refresh()
    },
    onError: (error) => toast.error(error.message),
  })
}
