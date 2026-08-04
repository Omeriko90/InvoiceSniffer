import type { Prisma } from "@prisma/client"

// Create or reactivate a per-sender IGNORE rule so future syncs penalize this
// sender's emails. One rule per (organization, sender). Shared by the invoice
// remove endpoint — both the "not an invoice" path (always mutes) and the
// opt-in "not relevant + also mute this sender" path.
export async function muteSender(
  tx: Prisma.TransactionClient,
  organizationId: string,
  senderEmail: string,
  vendorName: string
): Promise<void> {
  const normalized = senderEmail.toLowerCase()
  const existing = await tx.vendorAlias.findFirst({
    where: { organizationId, senderEmail: normalized, type: "IGNORE" },
    select: { id: true },
  })
  if (existing) {
    await tx.vendorAlias.update({ where: { id: existing.id }, data: { active: true } })
  } else {
    await tx.vendorAlias.create({
      data: {
        organizationId,
        merchantPattern: normalized,
        vendorName,
        senderEmail: normalized,
        type: "IGNORE",
        source: "USER",
      },
    })
  }
}
