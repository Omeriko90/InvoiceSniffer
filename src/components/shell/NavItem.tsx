// Client component by import — only ever rendered from <Sidebar>.
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[14px] transition-colors",
        active
          ? "font-[600] text-[#3B6FE0] bg-[rgba(122,167,255,0.16)]"
          : "font-[500] text-text-secondary hover:bg-hover"
      )}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <Badge className="bg-danger text-white text-[10px] font-[700] rounded-full min-w-4 h-4 px-1 justify-center">
          {badge}
        </Badge>
      )}
    </Link>
  )
}
