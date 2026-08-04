import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { createFixedExpense } from "@/api/fixed-expenses"

export function useCreateFixedExpense() {
  return useMutation({
    mutationFn: createFixedExpense,
    onSuccess: () => toast.success("Fixed expense created"),
    onError: (error) => toast.error(error.message),
  })
}
