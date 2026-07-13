// Client component by import — only ever rendered from <MatchDrawer>.
export function Panel({
  icon,
  title,
  subtitle,
  children,
  accent,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
  accent: string
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0 border border-border rounded-[13px] overflow-hidden">
      <div className="flex items-center gap-[9px] px-[15px] py-[12px] border-b border-hover">
        <div
          className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: accent }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-[700] text-heading truncate">{title}</p>
          <p className="text-[11px] text-dim truncate">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 flex-1 gap-px bg-hover">{children}</div>
    </div>
  )
}
