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

// Max number of *connected* accounting-platform integrations (Morning, Xero, …)
// an org may have, by plan tier. Same soft-disconnect semantics as Gmail: a
// disconnected credential does not count, so reconnecting never trips the limit.
export const MAX_INTEGRATIONS: Record<PlanTier, number> = {
  FREE: 1,
  PRO: 5,
  BUSINESS: 25,
}

export function maxIntegrations(tier: PlanTier): number {
  return MAX_INTEGRATIONS[tier]
}
