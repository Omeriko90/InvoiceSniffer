// Client component by import — only ever rendered from <InvoicesClient>.
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { vendorGradient, initials } from "./helpers"

export function VendorCell({ vendor, className }: { vendor: string; className?: string }) {
  return (
    <Avatar className={className ?? "size-7"}>
      <AvatarFallback
        className="text-white text-xs font-bold"
        style={{ background: vendorGradient(vendor) }}
      >
        {initials(vendor)}
      </AvatarFallback>
    </Avatar>
  )
}
