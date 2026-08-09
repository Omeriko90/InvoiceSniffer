import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils';

export function Calendar({ className, showOutsideDays = false, weekStartsOn = 1, ...props }: CalendarProps) {
  // `selected` is only present on some members of the DayPicker prop union
  // (single/multiple/range), so read it through a narrowing guard.
  const selected = 'selected' in props ? (props.selected as Date | Date[] | undefined) : undefined;
  const defaultMonth = selected
    ? Array.isArray(selected)
      ? selected[0] instanceof Date
        ? selected[0]
        : new Date()
      : selected instanceof Date
        ? selected
        : new Date()
    : new Date();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month_caption: 'flex justify-center relative items-center',
        caption_label: 'text-text-primary text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        button_previous: 'absolute left-0 text-text-secondary h-4 w-4 bg-transparent p-0 hover:opacity-80 disabled:text-faint',
        button_next: 'absolute right-0 text-text-secondary h-4 w-4 bg-transparent p-0 hover:opacity-80 disabled:text-faint',
        month_grid: 'mt-3 w-full border-collapse',
        weekdays: 'flex mb-1',
        weekday: 'text-text-secondary rounded-sm w-6 font-medium text-xs',
        week: 'flex w-full mt-1',
        day: 'h-6 w-6 text-xs text-center p-0 relative [&:has(.day-selected)]:bg-primary',
        day_button: 'text-text-primary h-6 w-6 p-0 hover:box-border hover:border hover:border-border hover:rounded disabled:text-faint',
        range_start: 'day-range-start rounded text-primary-foreground bg-primary',
        range_end: 'day-range-end rounded text-primary-foreground bg-primary',
        selected: props.mode === 'range' ? 'day-selected' : 'day-selected bg-primary rounded text-primary-foreground',
        outside: 'day-outside [&:not(.day-selected)]:opacity-50',
        range_middle: 'day-range-middle',
        hidden: 'invisible',
        disabled: 'day-disabled text-faint border-none'
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" strokeWidth={1} />
          ) : (
            <ChevronRight className="h-4 w-4" strokeWidth={1} />
          )
      }}
      formatters={{
        formatWeekdayName: (weekday) => format(weekday, 'EEEEE')
      }}
      weekStartsOn={weekStartsOn}
      defaultMonth={defaultMonth}
      {...props}
    />
  );
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>;
