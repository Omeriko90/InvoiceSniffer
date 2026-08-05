// Client component by import — only ever rendered from <Body>.
export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-[15px] py-[12px] border-b border-hover last:border-0">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-sm font-semibold text-heading">{value}</span>
    </div>
  )
}
