import type { PlanTier } from "@prisma/client"

// Max number of *connected* Gmail mailboxes an org may have, by plan tier.
// A soft-disconnected credential does not count against this, so reconnecting
// a known address never trips the limit.
export const MAX_GMAIL_ACCOUNTS: Record<PlanTier, number> = {
  FREE: 1,
  PRO: 3,
  BUSINESS: 10,
}

export function maxGmailAccounts(tier: PlanTier): number {
  return MAX_GMAIL_ACCOUNTS[tier]
}
