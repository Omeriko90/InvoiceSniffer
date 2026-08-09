// Client component by import — only ever rendered from <InvoicesClient>.
import { ExternalLink } from "lucide-react"

export function GmailLinkButton({ gmailLink }: { gmailLink: string }) {
  return (
    <a
      href={gmailLink}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in Gmail"
      aria-label="Open in Gmail"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex size-7 items-center justify-center rounded-full text-[#94A3B8] hover:bg-[#EFF6FF] hover:text-[#3B6FE0] transition-colors"
    >
      <ExternalLink size={14} strokeWidth={1.5} />
    </a>
  )
}
