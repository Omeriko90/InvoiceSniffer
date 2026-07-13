// Client component by import — only ever rendered from <Body>.
export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-[15px] py-[12px] border-b border-[#F1F3F8] last:border-0">
      <span className="text-[12.5px] text-text-secondary">{label}</span>
      <span className="text-[13px] font-[600] text-heading">{value}</span>
    </div>
  )
}
