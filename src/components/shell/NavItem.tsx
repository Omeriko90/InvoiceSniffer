// Client component by import — only ever rendered from <Sidebar>.
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { track } from "@/lib/analytics"

export function NavItem({ label, href, icon: Icon, active, badge }: {
  label: string
  href: string
  icon: React.ElementType
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      onClick={() => track("nav_item_clicked", { label, href })}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-sm transition-colors",
        active
          ? "font-semibold text-primary-strong bg-[rgba(122,167,255,0.16)]"
          : "font-medium text-text-secondary hover:bg-hover"
      )}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <Badge className="bg-danger text-white text-xs font-bold rounded-full min-w-4 h-4 px-1 justify-center">
          {badge}
        </Badge>
      )}
    </Link>
  )
}
