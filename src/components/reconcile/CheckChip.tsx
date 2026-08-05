// Client component by import — only ever rendered from <MatchDrawer>.
export function CheckChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
        ok ? "bg-success-bg text-success-fg" : "bg-danger-bg text-danger-fg"
      }`}
    >
      {ok ? "✓ " : "✕ "}
      {label}
    </span>
  )
}
