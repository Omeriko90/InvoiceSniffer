import { prisma } from "@/lib/prisma"
import { deleteExportObject } from "@/lib/r2"

// Deletes one export job (R2 object + DB row) for a given org. Returns false if
// no such job exists for this org (not found / not owned), true if deleted.
// Shared by the single and bulk DELETE routes so both behave identically.
export async function deleteExportJob(id: string, organizationId: string): Promise<boolean> {
  const job = await prisma.exportJob.findFirst({
    where: { id, organizationId },
    select: { id: true, r2Key: true },
  })
  if (!job) return false

  if (job.r2Key) {
    try {
      await deleteExportObject(job.r2Key)
    } catch (err) {
      // A storage hiccup must not block removing the row — the object is
      // lifecycle-expiring anyway. Log and continue.
      console.error(`Failed to delete R2 object for export ${id}:`, err)
    }
  }

  await prisma.exportJob.delete({ where: { id: job.id } })
  return true
}
