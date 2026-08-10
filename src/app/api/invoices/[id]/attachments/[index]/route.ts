import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getGmailClient, GmailNotConnectedError } from "@/lib/gmail"
import { type AttachmentMeta } from "@/workers/invoice-extract"
import {
  fetchAttachmentBytes,
  AttachmentNotFoundError,
  AttachmentTooLargeError,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/gmail-attachments"
import { log } from "@/lib/posthog-server"
import { type AttachmentErrorReason } from "@/lib/attachment-error"
import { NextResponse } from "next/server"

// Types safe to render inline — PDFs and raster images can't execute script.
// SVG and HTML are deliberately excluded (active content).
const INLINE_SAFE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
])

// This endpoint is opened in a new browser tab (target="_blank"), so a raw JSON
// error would show as ugly, confusing text. Redirect to the friendly, fully
// tokenized /attachment-error page instead; the reason code selects the copy
// and CTA there (e.g. a Reconnect button when Gmail needs re-authorizing).
function errorRedirect(request: Request, reason: AttachmentErrorReason): NextResponse {
  return NextResponse.redirect(new URL(`/attachment-error?reason=${reason}`, request.url))
}

// Streams an invoice attachment straight from Gmail — the file is never
// stored, only proxied to the browser for viewing
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const session = await auth()
  if (!session) {
    return errorRedirect(request, "signin")
  }

  const { id, index } = await params
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { gmailMessageId: true, gmailCredentialId: true, attachmentMeta: true },
  })
  if (!invoice) {
    return errorRedirect(request, "invoice-not-found")
  }

  // Attribution is required to know which mailbox holds this message. Orphaned
  // rows (pre-migration, or whose mailbox was hard-removed) can't be fetched.
  if (!invoice.gmailCredentialId) {
    return errorRedirect(request, "gmail-not-connected")
  }

  const attachments = invoice.attachmentMeta as AttachmentMeta[]
  const meta = attachments[Number(index)]
  if (!meta || meta.size > MAX_ATTACHMENT_BYTES) {
    return errorRedirect(request, "attachment-unavailable")
  }

  try {
    const gmail = await getGmailClient(invoice.gmailCredentialId)

    const bytes = await fetchAttachmentBytes(gmail, invoice.gmailMessageId, meta)

    // Some senders mislabel PDFs as octet-stream; fix the type so the
    // browser renders inline instead of downloading
    const mimeType =
      meta.mimeType === "application/octet-stream" && meta.filename.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : meta.mimeType

    // Only render trusted, non-active types inline. Anything else (SVG, HTML,
    // etc.) is forced to download — inlining it would run attacker-supplied
    // script on our origin, since the file comes from an untrusted email.
    const disposition = INLINE_SAFE_TYPES.has(mimeType) ? "inline" : "attachment"

    const asciiName = meta.filename.replace(/[^\w .-]/g, "_")
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mimeType,
        // ASCII fallback plus RFC 5987 UTF-8 form for Hebrew filenames
        "Content-Disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(meta.filename)}`,
        "Cache-Control": "private, no-store",
        // Block MIME sniffing — a text file must not be reinterpreted as HTML
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    if (error instanceof GmailNotConnectedError) {
      return errorRedirect(request, "gmail-out-of-sync")
    }
    if (error instanceof AttachmentNotFoundError) {
      return errorRedirect(request, "attachment-unavailable")
    }
    if (error instanceof AttachmentTooLargeError) {
      return errorRedirect(request, "too-large")
    }
    log.error("Attachment fetch failed", { error: error instanceof Error ? error.message : String(error) })
    return errorRedirect(request, "fetch-failed")
  }
}
