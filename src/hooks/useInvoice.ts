import { useQuery } from "@tanstack/react-query"
import { queries } from "@/queries"
import { fetchInvoice } from "@/api/invoices"

// One invoice's full detail, fetched only when an id is set (drawer open).
export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: queries.invoices.detail(id ?? "").queryKey,
    queryFn: () => fetchInvoice(id!),
    enabled: !!id,
  })
}
