// Client component by import — a labelled Select for filter popovers. One API
// covers single-value and multiple selection (base-ui Select `multiple`); the
// only real differences are the value type and the trigger's summary label.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type FilterOption = { value: string; label: string }

type SingleProps = {
  label: string
  options: FilterOption[]
  multiple?: false
  value: string
  onChange: (value: string) => void
}

type MultipleProps = {
  label: string
  options: FilterOption[]
  multiple: true
  value: string[]
  onChange: (value: string[]) => void
  // Trigger text when nothing is selected (empty selection = no filter).
  allLabel: string
}

export type FilterSelectProps = SingleProps | MultipleProps

// Single place to tune the filter-trigger size.
const TRIGGER_CLASS =
  "w-full h-auto py-5.5 rounded-[10px] border-border bg-surface text-sm font-semibold text-text-primary"
const CONTENT_CLASS = "w-fit min-w-(--anchor-width)"

export function FilterSelect(props: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-text-secondary">
        {props.label}
      </span>
      {props.multiple ? (
        <Select
          multiple
          items={props.options}
          value={props.value}
          onValueChange={(v) => props.onChange(v as string[])}
        >
          <SelectTrigger className={TRIGGER_CLASS}>
            <SelectValue>
              {(value) => {
                const v = value as string[]
                const text =
                  v.length === 0
                    ? props.allLabel
                    : v.length === 1
                      ? props.options.find((o) => o.value === v[0])?.label ?? "1 selected"
                      : `${v.length} selected`
                // An empty multiple value marks the trigger as "placeholder", which
                // would mute the text — render it in the normal color so it matches
                // the single-value filters.
                return <span className="text-text-primary">{text}</span>
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className={CONTENT_CLASS}>
            {props.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Select
          items={props.options}
          value={props.value}
          onValueChange={(v) => props.onChange(v as string)}
        >
          <SelectTrigger className={TRIGGER_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={CONTENT_CLASS}>
            {props.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
