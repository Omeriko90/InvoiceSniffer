import { fetchGmailStatus } from "@/api/gmail"
import { createQueryKeys } from "@lukemorales/query-key-factory"

export const gmailKeys = createQueryKeys("gmail", {
  status: {
    queryKey: null,
    queryFn: () => fetchGmailStatus(),
  },
})
