import { fetchExportsHistory } from "@/api/exports";
import { createQueryKeys } from "@lukemorales/query-key-factory"

export const exportsKeys = createQueryKeys("exports", {
  list: {
    queryKey: null,
    queryFn: () => fetchExportsHistory(),
  },
})
