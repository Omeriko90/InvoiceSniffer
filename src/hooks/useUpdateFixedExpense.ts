import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { updateFixedExpense } from "@/api/fixed-expenses"

export function useUpdateFixedExpense() {
  return useMutation({
    mutationFn: updateFixedExpense,
    onSuccess: () => toast.success("Fixed expense updated"),
    onError: (error) => toast.error(error.message),
  })
}
