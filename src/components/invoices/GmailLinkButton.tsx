// Client component by import — only ever rendered from <InvoicesClient>.
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function GmailLinkButton({ gmailLink }: { gmailLink: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      title="Open in Gmail"
      className="text-[#94A3B8] hover:bg-[#EFF6FF] hover:text-[#3B6FE0]"
      nativeButton={false}
      render={
        <a
          href={gmailLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        />
      }
    >
      <ExternalLink size={14} strokeWidth={1.5} />
    </Button>
  )
}
