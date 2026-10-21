// Client component by import — only ever rendered from <ImportWizard>.
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ColumnSelect } from "./ColumnSelect"
import { useT } from "@/components/i18n/LocaleProvider"
import { MappingRowProps } from "./types"

// Maps the field key (data, from constants.ts) to its UI label/hint translation keys.
const FIELD_LABEL_KEYS = {
  date: "import_csv.field.date.label",
  merchant: "import_csv.field.merchant.label",
  amount: "import_csv.field.amount.label",
  currency: "import_csv.field.currency.label",
} as const

const FIELD_HINT_KEYS = {
  date: "import_csv.field.date.hint",
  merchant: "import_csv.field.merchant.hint",
  amount: "import_csv.field.amount.hint",
  currency: "import_csv.field.currency.hint",
} as const

export function MappingRow({ field, first, headers, value, onChange }: MappingRowProps) {
  const t = useT()
  return (
    <div
      className={cn(
        "grid items-center gap-4 py-3.5",
        !first && "border-t border-border"
      )}
      style={{ gridTemplateColumns: "1fr 20px 1.4fr" }}
    >
      <div>
        <p className="text-sm font-semibold text-heading">{t(FIELD_LABEL_KEYS[field.key])}</p>
        <p className="text-xs text-dim mt-0.5">{t(FIELD_HINT_KEYS[field.key])}</p>
      </div>
      <ArrowRight size={15} strokeWidth={2} className="text-faint" />
      <ColumnSelect headers={headers} value={value} onChange={onChange} />
    </div>
  )
}
