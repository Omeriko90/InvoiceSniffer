import { ExportsHistoryClient } from "@/components/exports/ExportsHistoryClient"

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-text-secondary">
        Your invoice exports. Files stay available for re-download until they expire.
      </p>
      <ExportsHistoryClient />
    </div>
  )
}
