import type { gmail_v1 } from "googleapis"
import { extractAttachmentMeta, type AttachmentMeta, type GmailPart } from "@/workers/invoice-extract"

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

export class AttachmentTooLargeError extends Error {
  constructor() {
    super("Attachment exceeds the size limit")
    this.name = "AttachmentTooLargeError"
  }
}

export class AttachmentNotFoundError extends Error {
  constructor() {
    super("Attachment not found")
    this.name = "AttachmentNotFoundError"
  }
}

// Fetch a single attachment's bytes straight from Gmail. Gmail attachment ids can
// go stale, so on failure we re-fetch the message and resolve a fresh id by
// filename. The 25MB cap is enforced on the ACTUAL downloaded bytes — the
// stale-id fallback resolves an attachment whose metadata size was never checked.
//
// Shared by the inline attachment-viewer route and the export runner.
export async function fetchAttachmentBytes(
  gmail: gmail_v1.Gmail,
  gmailMessageId: string,
  meta: AttachmentMeta
): Promise<Buffer> {
  let data: string | null | undefined

  try {
    const res = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: gmailMessageId,
      id: meta.attachmentId,
    })
    data = res.data.data
  } catch {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: gmailMessageId,
      format: "full",
    })
    const fresh = extractAttachmentMeta(msg.data.payload as GmailPart).find(
      (a) => a.filename === meta.filename
    )
    if (!fresh) throw new AttachmentNotFoundError()
    const res = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: gmailMessageId,
      id: fresh.attachmentId,
    })
    data = res.data.data
  }

  if (!data) throw new AttachmentNotFoundError()

  const bytes = Buffer.from(data, "base64url")
  if (bytes.byteLength > MAX_ATTACHMENT_BYTES) throw new AttachmentTooLargeError()
  return bytes
}

// Some senders mislabel PDFs as octet-stream; treat a .pdf filename as a PDF.
export function isPdfAttachment(meta: AttachmentMeta): boolean {
  return (
    meta.mimeType === "application/pdf" ||
    (meta.mimeType === "application/octet-stream" && meta.filename.toLowerCase().endsWith(".pdf"))
  )
}
