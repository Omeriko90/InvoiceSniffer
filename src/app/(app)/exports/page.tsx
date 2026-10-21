import { ExportsHistory } from "@/components/exports/ExportsHistory"

export default function Page() {
  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      <p className="text-lg font-medium text-text-secondary">
        Your invoice exports
      </p>
      <ExportsHistory />
    </div>
  )
}
