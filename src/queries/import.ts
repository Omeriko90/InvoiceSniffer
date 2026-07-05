import { fetchCsvMappings } from "@/api/import"
import { createQueryKeys } from "@lukemorales/query-key-factory"

export const importKeys = createQueryKeys("import", {
  mappings: {
    queryKey: null,
    queryFn: () => fetchCsvMappings(),
  },
})
