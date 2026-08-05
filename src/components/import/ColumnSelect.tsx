// Client component by import — only ever rendered from <ImportWizard>.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ColumnSelectProps } from "./types"

export function ColumnSelect({ headers, value, onChange }: ColumnSelectProps) {
  const items = [
    { value: null, label: "— not mapped —" },
    ...headers.map((h) => ({ value: h, label: h })),
  ]
  return (
    <Select items={items} value={value} onValueChange={(v) => onChange(v as string | null)}>
      <SelectTrigger
        className={cn(
          "w-full h-10 ps-3.5 pe-3 rounded-[9px] text-sm",
          value
            ? "text-heading font-medium border-success-border bg-success-bg"
            : "text-dim border-border bg-surface"
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={null}>— not mapped —</SelectItem>
        {headers.map((h) => (
          <SelectItem key={h} value={h}>{h}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
