import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteFixedExpense } from "@/api/fixed-expenses"

export function useDeleteFixedExpense() {
  return useMutation({
    mutationFn: deleteFixedExpense,
    onSuccess: () => toast.success("Fixed expense deleted"),
    onError: (error) => toast.error(error.message),
  })
}
