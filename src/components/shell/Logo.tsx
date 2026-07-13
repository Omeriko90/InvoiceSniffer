// Client component by import — only ever rendered from <Sidebar>.
export function Logo({ orgName }: { orgName: string }) {
  return (
    <div className="px-[18px] pt-6 pb-5">
      <div className="flex items-center gap-3">
        <div
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center shadow-logo shrink-0"
          style={{ background: "linear-gradient(135deg, #7AA7FF, #A78BFA)" }}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-[800] text-heading leading-none">Reconcile</p>
          <p className="text-[11px] text-dim mt-0.5 leading-none">{orgName}</p>
        </div>
      </div>
    </div>
  )
}
