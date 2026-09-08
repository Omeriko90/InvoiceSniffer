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

// Max number of WhatsApp phone numbers an org may link, by plan tier. Each
// linked number is a person who can forward invoices into the org.
export const MAX_WHATSAPP_NUMBERS: Record<PlanTier, number> = {
  FREE: 1,
  PRO: 3,
  BUSINESS: 10,
}

export function maxWhatsAppNumbers(tier: PlanTier): number {
  return MAX_WHATSAPP_NUMBERS[tier]
}
