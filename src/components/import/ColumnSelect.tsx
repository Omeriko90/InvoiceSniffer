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
          "w-full h-10 pl-3.5 pr-3 rounded-[9px] text-[13.5px]",
          value
            ? "text-heading font-[500] border-[#D1FAE5] bg-[#F0FDF4]"
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
