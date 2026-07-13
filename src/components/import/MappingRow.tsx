// Client component by import — only ever rendered from <ImportWizard>.
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ColumnSelect } from "./ColumnSelect"
import { MappingRowProps } from "./types"

export function MappingRow({ field, first, headers, value, onChange }: MappingRowProps) {
  return (
    <div
      className={cn(
        "grid items-center gap-4 py-[14px]",
        !first && "border-t border-border"
      )}
      style={{ gridTemplateColumns: "1fr 20px 1.4fr" }}
    >
      <div>
        <p className="text-[14px] font-[600] text-heading">{field.label}</p>
        <p className="text-[12.5px] text-dim mt-0.5">{field.hint}</p>
      </div>
      <ArrowRight size={15} strokeWidth={2} className="text-faint" />
      <ColumnSelect headers={headers} value={value} onChange={onChange} />
    </div>
  )
}
