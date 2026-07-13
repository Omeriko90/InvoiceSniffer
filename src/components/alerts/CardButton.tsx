// Client component by import — only ever rendered from <AlertCard>.
// Small pill-shaped button matching the mock's View/Dismiss affordances.
export function CardButton({
  onClick,
  disabled,
  muted,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-[12.5px] font-[600] px-[13px] py-[7px] rounded-[9px] border border-[#E8EDFA] bg-white whitespace-nowrap cursor-pointer transition-colors hover:bg-[#F1F3F8] disabled:opacity-50 disabled:cursor-default"
      style={{ color: muted ? "#94A3B8" : "#475569" }}
    >
      {children}
    </button>
  )
}
