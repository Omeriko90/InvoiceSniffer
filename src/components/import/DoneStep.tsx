// Client component by import — only ever rendered from <ImportWizard>.
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DoneStepProps } from "./types"

export function DoneStep({ imported, skipped, onImportAnother }: DoneStepProps) {
  return (
    <div className="bg-surface border border-border rounded-[14px] p-8 flex flex-col items-center gap-4 py-16">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-white"
        style={{ background: "linear-gradient(135deg, #34D399, #A7F3D0)" }}
      >
        <Check size={26} strokeWidth={2.5} />
      </div>
      <div className="text-center">
        <h2 className="text-[18px] font-[700] text-heading">
          {imported} transactions imported
        </h2>
        <p className="text-[13.5px] text-text-secondary mt-1">
          {skipped > 0
            ? `${skipped} rows were skipped because their date or amount couldn't be read.`
            : "All rows imported successfully."}{" "}
          Head to Reconcile to match them against your invoices.
        </p>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <Button variant="outline" size="lg" className="text-[13.5px] px-4" onClick={onImportAnother}>
          Import another file
        </Button>
        <Button
          size="lg"
          className="text-[13.5px] px-4 text-white shadow-primary border-0"
          style={{ background: "linear-gradient(135deg, #7AA7FF, #88D0FF)" }}
          nativeButton={false}
          render={<Link href="/reconcile" />}
        >
          Go to Reconcile →
        </Button>
      </div>
    </div>
  )
}
