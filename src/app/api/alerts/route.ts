import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { FILTER_SEVERITY } from "@/lib/alert-helpers"
import type { AlertFilter } from "@/api-types/alerts"

const filterSchema = z.enum(["all", "critical", "warning", "info"]).catch("all")

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { organizationId } = session.user

  const filter: AlertFilter = filterSchema.parse(
    new URL(request.url).searchParams.get("severity") ?? "all",
  )
  const severity = FILTER_SEVERITY[filter]

  const [rows, bySeverity] = await Promise.all([
    prisma.anomalyLog.findMany({
      where: { organizationId, acknowledged: false, ...(severity ? { severity } : {}) },
      orderBy: { createdAt: "desc" },
      include: { invoice: { select: { vendorName: true } } },
    }),
    // Counts over ALL unacknowledged alerts, independent of the active filter.
    prisma.anomalyLog.groupBy({
      by: ["severity"],
      where: { organizationId, acknowledged: false },
      _count: true,
    }),
  ])

  const counts = { all: 0, critical: 0, warning: 0, info: 0 }
  for (const g of bySeverity) {
    counts.all += g._count
    if (g.severity === "HIGH")   counts.critical = g._count
    if (g.severity === "MEDIUM") counts.warning  = g._count
    if (g.severity === "LOW")    counts.info     = g._count
  }

  return NextResponse.json({
    alerts: rows.map((a) => ({
      id:         a.id,
      type:       a.type,
      severity:   a.severity,
      details:    a.details,
      vendorName: a.vendorName,
      invoice:    a.invoice,
    })),
    counts,
  })
}
