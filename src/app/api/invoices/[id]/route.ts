import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const data: Prisma.InvoiceUpdateManyMutationInput = {}

  if ("vendorName" in body) {
    const v = body.vendorName
    if (v !== null && typeof v !== "string") {
      return NextResponse.json({ error: "Invalid vendor name" }, { status: 400 })
    }
    data.vendorName = v?.trim() || null
    data.vendorNormalized = v?.trim().toLowerCase() || null
  }

  if ("invoiceNumber" in body) {
    const v = body.invoiceNumber
    if (v !== null && typeof v !== "string") {
      return NextResponse.json({ error: "Invalid invoice number" }, { status: 400 })
    }
    data.invoiceNumber = v?.trim() || null
  }

  if ("totalAmount" in body) {
    const n = Number(body.totalAmount)
    if (typeof body.totalAmount !== "string" || !Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }
    data.totalAmount = body.totalAmount
  }

  for (const field of ["invoiceDate", "dueDate"] as const) {
    if (field in body) {
      const v = body[field]
      if (v === null) {
        data[field] = null
      } else if (typeof v === "string" && !Number.isNaN(Date.parse(v))) {
        data[field] = new Date(v)
      } else {
        return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 })
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 })
  }

  // Scope by organizationId so users can't edit another org's invoices
  const result = await prisma.invoice.updateMany({
    where: { id, organizationId: session.user.organizationId },
    data,
  })

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
