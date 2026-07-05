import { fetchSettings } from "@/api/settings"
import { createQueryKeys } from "@lukemorales/query-key-factory"

export const settingsKeys = createQueryKeys("settings", {
  all: {
    queryKey: null,
    queryFn: () => fetchSettings(),
  },
})
