import * as React from 'react';
import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '../calendar/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { cn } from '../utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function DatePickerWithRange(props: DatePickerWithRangeProps) {
  const { className, label, value, onDateChange } = props;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleDateRangeChange = (selectedDateRange: DateRange | undefined) => {
    onDateChange?.({
      from: selectedDateRange?.from,
      to: selectedDateRange?.to
    });
  };

  const handleInteractOutside = (event: Event) => {
    if (triggerRef.current && triggerRef.current.contains(event.target as Node)) {
      return;
    }
    setIsPopoverOpen(false);
  };

  return (
    <div className="grid gap-2">
      <Popover open={isPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            id="date"
            className={cn('flex items-center text-sm text-left text-text-primary gap-2', className)}
            onClick={() => {
              setIsPopoverOpen(!isPopoverOpen);
            }}
          >
            {label && <span className="text-text-secondary w-fit-content">{label}:</span>}

            <div className="font-medium min-w-[3.75rem]">{getFormattedSelectedDateRange(value)}</div>

            {isPopoverOpen && <ChevronUp size={15} strokeWidth={1} />}
            {!isPopoverOpen && <ChevronDown size={15} strokeWidth={1} />}
          </button>
        </PopoverTrigger>

        <PopoverContent
          sideOffset={5}
          className="w-auto p-0 rounded-lg shadow bg-surface z-20"
          align="start"
          onInteractOutside={handleInteractOutside}
        >
          <Calendar defaultMonth={value?.from} selected={value} mode="range" numberOfMonths={1} onSelect={handleDateRangeChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export type DatePickerWithRangeProps = {
  className?: string;
  label?: string;
  value?: DateRange;
  onDateChange?: (date?: DateRange) => void;
};

const getFormattedSelectedDateRange = (selectedDateRange: DateRange | undefined) => {
  if (!selectedDateRange || !selectedDateRange.from) {
    return 'Any time';
  }

  const DISPLAYED_DATE_FORMAT = 'LLL d';

  if (selectedDateRange.from && selectedDateRange.to) {
    return `${format(selectedDateRange.from, DISPLAYED_DATE_FORMAT)} - ${format(selectedDateRange.to, DISPLAYED_DATE_FORMAT)}`;
  }

  return format(selectedDateRange.from, DISPLAYED_DATE_FORMAT);
};
