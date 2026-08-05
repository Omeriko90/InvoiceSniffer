// Client component by import — only ever rendered from <MatchDrawer>.
export function CheckChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`text-[11.5px] font-[700] px-[10px] py-[4px] rounded-full ${
        ok ? "bg-success-bg text-success-fg" : "bg-danger-bg text-danger-fg"
      }`}
    >
      {ok ? "✓ " : "✕ "}
      {label}
    </span>
  )
}
