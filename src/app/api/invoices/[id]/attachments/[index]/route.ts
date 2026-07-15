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
// error would show as ugly, confusing text. Render a friendly fallback page
// instead — and when Gmail needs re-authorizing, offer a Reconnect button.
function errorPage(
  status: number,
  heading: string,
  message: string,
  opts: { reconnect?: boolean } = {}
): NextResponse {
  const action = opts.reconnect
    ? `<a class="btn" href="/api/gmail/connect">Reconnect Gmail</a>`
    : `<a class="btn" href="/settings">Go to settings</a>`
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${heading}</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:#F6F8FD; color:#0F172A; display:flex; min-height:100vh; align-items:center; justify-content:center; padding:24px; }
  .card { background:#fff; border:1px solid #E8EDFA; border-radius:16px; padding:32px; max-width:440px; text-align:center;
    box-shadow:0 8px 30px rgba(15,23,42,0.06); }
  .icon { width:48px; height:48px; border-radius:999px; background:#FFF7ED; color:#B45309;
    display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:24px; }
  h1 { font-size:17px; margin:0 0 8px; }
  p { font-size:13.5px; line-height:1.55; color:#64748B; margin:0 0 20px; }
  .btn { display:inline-block; background:linear-gradient(135deg,#7AA7FF,#88D0FF); color:#fff; text-decoration:none;
    font-size:13.5px; font-weight:600; padding:9px 18px; border-radius:10px; }
</style></head>
<body><div class="card">
  <div class="icon">⚠️</div>
  <h1>${heading}</h1>
  <p>${message}</p>
  ${action}
</div></body></html>`
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
  })
}

// Streams an invoice attachment straight from Gmail — the file is never
// stored, only proxied to the browser for viewing
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const session = await auth()
  if (!session) {
    return errorPage(401, "Please sign in", "Your session has expired. Sign in and try opening the attachment again.")
  }

  const { id, index } = await params
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { gmailMessageId: true, gmailCredentialId: true, attachmentMeta: true },
  })
  if (!invoice) {
    return errorPage(404, "Invoice not found", "This invoice no longer exists or isn't part of your workspace.")
  }

  // Attribution is required to know which mailbox holds this message. Orphaned
  // rows (pre-migration, or whose mailbox was hard-removed) can't be fetched.
  if (!invoice.gmailCredentialId) {
    return errorPage(
      400,
      "Gmail not connected",
      "This invoice isn't linked to a connected mailbox, so its attachment can't be fetched. Reconnect Gmail to restore access.",
      { reconnect: true }
    )
  }

  const attachments = invoice.attachmentMeta as AttachmentMeta[]
  const meta = attachments[Number(index)]
  if (!meta || meta.size > MAX_ATTACHMENT_BYTES) {
    return errorPage(404, "Attachment unavailable", "We couldn't find this attachment on the original email.")
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
      return errorPage(
        400,
        "Gmail out of sync",
        "Gmail access has expired for this mailbox, so the attachment can't be fetched. Reconnect to restore access.",
        { reconnect: true }
      )
    }
    if (error instanceof AttachmentNotFoundError) {
      return errorPage(404, "Attachment unavailable", "We couldn't find this attachment on the original email.")
    }
    if (error instanceof AttachmentTooLargeError) {
      return errorPage(413, "Attachment too large", "This attachment exceeds the 25 MB limit and can't be opened here.")
    }
    log.error("Attachment fetch failed", { error: error instanceof Error ? error.message : String(error) })
    return errorPage(
      502,
      "Couldn't open attachment",
      "Something went wrong fetching this file from Gmail. Please try again in a moment."
    )
  }
}
