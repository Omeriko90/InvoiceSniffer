// Client component by import — rendered inside client trees only.
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

// shadcn-style wrapper around react-day-picker v9, styled with the app's
// semantic tokens. Layout is fully expressed via `classNames` so no external
// stylesheet import is needed.
export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center items-center h-8",
        caption_label: "text-sm font-bold text-heading",
        nav: "flex items-center absolute inset-x-0 top-[14px] justify-between",
        button_previous:
          "inline-flex items-center justify-center h-7 w-7 rounded bg-transparent text-text-secondary hover:bg-hover transition-colors cursor-pointer z-10",
        button_next:
          "inline-flex items-center justify-center h-7 w-7 rounded bg-transparent text-text-secondary hover:bg-hover transition-colors cursor-pointer z-10",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-dim w-9 text-xs font-semibold uppercase tracking-[0.03em]",
        week: "flex w-full mt-1",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button:
          "h-9 w-9 rounded-full font-medium text-text-primary hover:bg-hover transition-colors cursor-pointer inline-flex items-center justify-center",
        // Range modifiers are applied to the day *cell*; the light-blue bar lives
        // on the cell, the solid endpoints on the button inside it.
        range_start:
          "bg-primary-soft rounded-s-full [&>button]:bg-primary-strong [&>button]:text-surface [&>button]:hover:bg-primary-strong",
        range_end:
          "bg-primary-soft rounded-e-full [&>button]:bg-primary-strong [&>button]:text-surface [&>button]:hover:bg-primary-strong",
        // In range mode every in-range day also carries the `selected` modifier,
        // so override its white text/blue fill here with `!` to keep the middle
        // days looking like normal (unselected) days on the soft-blue bar.
        range_middle:
          "bg-primary-soft [&>button]:!bg-transparent [&>button]:text-primary [&>button]:rounded-none [&>button]:hover:!bg-transparent",
        selected: "[&>button]:bg-primary-strong",
        today: "[&>button]:font-extrabold [&>button]:text-primary-strong",
        outside: "text-faint [&>button]:text-faint",
        disabled: "text-faint opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft size={16} strokeWidth={2} />
          ) : (
            <ChevronRight size={16} strokeWidth={2} />
          ),
      }}
      {...props}
    />
  )
}
