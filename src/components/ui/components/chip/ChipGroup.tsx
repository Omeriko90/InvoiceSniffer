import React from 'react';
import { cn } from '../utils';
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from '../tooltip/Tooltip';
import { Chip, ChipProps } from './Chip';
import { FlagChip } from './FlagChip';

export type ChipGroupItem = {
  id: string;
  label: string;
};

export type ChipGroupProps = {
  items: ChipGroupItem[];
  limitVisibleItems?: number;
  type?: 'default' | 'flag';
  onRemove?: (id: string) => void;
  startElement?: React.ReactNode;
  className?: string;
  color?: ChipProps['color'];
};

export function ChipGroup({
  items,
  limitVisibleItems = 2,
  type = 'default',
  onRemove,
  startElement,
  className,
  color
}: ChipGroupProps) {
  const visible = items.slice(0, limitVisibleItems);
  const hidden = items.slice(limitVisibleItems);
  const isFlag = type === 'flag';
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)} onClick={(e) => e.stopPropagation()}>
      {visible.map((item) =>
        isFlag ? (
          <FlagChip key={item.id} currency={item.label} color={color} onRemove={onRemove ? () => onRemove(item.id) : undefined} />
        ) : (
          <Chip
            key={item.id}
            text={item.label}
            color={color}
            startElement={startElement}
            onRemove={onRemove ? () => onRemove(item.id) : undefined}
          />
        )
      )}
      {hidden.length > 0 && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger>
            <Chip text={`+${hidden.length}`} color={color} />
          </TooltipTrigger>
          <TooltipContent className="flex flex-col gap-1" align="center" side="top">
            <TooltipArrow />
            {hidden.map((item) => (
              <span key={item.id}>{item.label}</span>
            ))}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
