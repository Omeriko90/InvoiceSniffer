// Client component by import — only ever rendered from <Sidebar>.
import { NavItem } from "./NavItem"
import type { NavEntry } from "./types"

export function NavGroup({ label, items, pathname, badges }: {
  label: string
  items: NavEntry[]
  pathname: string
  badges?: Record<string, number | undefined>
}) {
  return (
    <div>
      <p className="text-[11px] font-[700] text-dim uppercase tracking-[0.05em] mb-1 px-2.5">
        {label}
      </p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
            badge={badges?.[item.href]}
          />
        ))}
      </div>
    </div>
  )
}
