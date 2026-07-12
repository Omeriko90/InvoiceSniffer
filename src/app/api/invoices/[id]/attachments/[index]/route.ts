import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getGmailClient, GmailNotConnectedError } from "@/lib/gmail"
import { extractAttachmentMeta, type AttachmentMeta, type GmailPart } from "@/workers/invoice-extract"
import { NextResponse } from "next/server"

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

// Streams an invoice attachment straight from Gmail — the file is never
// stored, only proxied to the browser for viewing
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, index } = await params
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { gmailMessageId: true, attachmentMeta: true },
  })
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const attachments = invoice.attachmentMeta as AttachmentMeta[]
  const meta = attachments[Number(index)]
  if (!meta || meta.size > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
  }

  try {
    const gmail = await getGmailClient(session.user.organizationId)

    let data: string | null | undefined
    try {
      const res = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId: invoice.gmailMessageId,
        id: meta.attachmentId,
      })
      data = res.data.data
    } catch {
      // Gmail attachment ids can go stale — re-fetch the message and resolve
      // a fresh id by filename
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: invoice.gmailMessageId,
        format: "full",
      })
      const fresh = extractAttachmentMeta(msg.data.payload as GmailPart).find(
        (a) => a.filename === meta.filename
      )
      if (!fresh) return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
      const res = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId: invoice.gmailMessageId,
        id: fresh.attachmentId,
      })
      data = res.data.data
    }

    if (!data) return NextResponse.json({ error: "Attachment not found" }, { status: 404 })

    // Some senders mislabel PDFs as octet-stream; fix the type so the
    // browser renders inline instead of downloading
    const mimeType =
      meta.mimeType === "application/octet-stream" && meta.filename.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : meta.mimeType

    return new NextResponse(new Uint8Array(Buffer.from(data, "base64url")), {
      headers: {
        "Content-Type": mimeType,
        // ASCII fallback plus RFC 5987 UTF-8 form for Hebrew filenames
        "Content-Disposition": `inline; filename="${meta.filename.replace(/[^\w .-]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(meta.filename)}`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    if (error instanceof GmailNotConnectedError) {
      return NextResponse.json({ error: "Gmail is not connected" }, { status: 400 })
    }
    console.error("Attachment fetch failed", error)
    return NextResponse.json({ error: "Failed to fetch attachment" }, { status: 502 })
  }
}
