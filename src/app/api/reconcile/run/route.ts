import { auth } from "@/lib/auth"
import { runMatching } from "@/lib/run-matching"
import { NextResponse } from "next/server"

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await runMatching(session.user.organizationId)
  return NextResponse.json(result)
}
