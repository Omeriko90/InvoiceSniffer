// Client component by import — only ever rendered from <MatchDrawer>.
export function Field({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex flex-col justify-between gap-[2px] bg-card px-[15px] py-[13px]">
      <span className="text-[10.5px] font-[700] uppercase tracking-[0.05em] text-dim">
        {label}
      </span>
      <span className={muted ? "text-lg font-[600] text-dim" : "text-lg font-[600] text-foreground"}>
        {value}
      </span>
    </div>
  )
}
