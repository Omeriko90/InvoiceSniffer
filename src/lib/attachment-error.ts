// Copy + CTA for the attachment error page. Shared by the page (which renders
// it) and the attachment route (which picks a reason code when redirecting), so
// the set of valid reasons and their wording can't drift apart.

export type AttachmentErrorReason =
  | "signin"
  | "invoice-not-found"
  | "gmail-not-connected"
  | "attachment-unavailable"
  | "gmail-out-of-sync"
  | "too-large"
  | "fetch-failed"

export type AttachmentErrorVariant = {
  heading: string
  message: string
  cta: string
  href: string
}

export const ATTACHMENT_ERRORS: Record<AttachmentErrorReason, AttachmentErrorVariant> = {
  signin: {
    heading: "Please sign in",
    message: "Your session has expired. Sign in and try opening the attachment again.",
    cta: "Go to settings",
    href: "/settings",
  },
  "invoice-not-found": {
    heading: "Invoice not found",
    message: "This invoice no longer exists or isn't part of your workspace.",
    cta: "Go to settings",
    href: "/settings",
  },
  "gmail-not-connected": {
    heading: "Gmail not connected",
    message:
      "This invoice isn't linked to a connected mailbox, so its attachment can't be fetched. Reconnect Gmail to restore access.",
    cta: "Reconnect Gmail",
    href: "/api/gmail/connect",
  },
  "attachment-unavailable": {
    heading: "Attachment unavailable",
    message: "We couldn't find this attachment on the original email.",
    cta: "Go to settings",
    href: "/settings",
  },
  "gmail-out-of-sync": {
    heading: "Gmail out of sync",
    message:
      "Gmail access has expired for this mailbox, so the attachment can't be fetched. Reconnect to restore access.",
    cta: "Reconnect Gmail",
    href: "/api/gmail/connect",
  },
  "too-large": {
    heading: "Attachment too large",
    message: "This attachment exceeds the 25 MB limit and can't be opened here.",
    cta: "Go to settings",
    href: "/settings",
  },
  "fetch-failed": {
    heading: "Couldn't open attachment",
    message: "Something went wrong fetching this file from Gmail. Please try again in a moment.",
    cta: "Go to settings",
    href: "/settings",
  },
}

export const DEFAULT_ATTACHMENT_ERROR: AttachmentErrorReason = "fetch-failed"

export function resolveAttachmentError(reason?: string): AttachmentErrorVariant {
  return (
    ATTACHMENT_ERRORS[reason as AttachmentErrorReason] ??
    ATTACHMENT_ERRORS[DEFAULT_ATTACHMENT_ERROR]
  )
}
