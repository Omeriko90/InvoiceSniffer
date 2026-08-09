import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../utils';

export function MultiStepIndicatorItem(props: MultiStepIndicatorItemProps) {
  const { index, title, current, onClick, completed, className } = props;

  return (
    <div className={cn('flex items-center gap-1.5', completed && 'cursor-pointer', className)} onClick={onClick}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full size-5',
          current ? 'bg-primary text-primary-foreground' : 'bg-hover text-text-secondary'
        )}
      >
        {completed ? <Check className="size-3" /> : <span className="text-3-regular">{index + 1}</span>}
      </div>
      <span className={cn('text-3-regular whitespace-nowrap', current ? 'text-text-primary' : 'text-text-secondary')}>{title}</span>
    </div>
  );
}

export interface MultiStepIndicatorItemProps {
  index: number;
  title: string;
  current: boolean;
  onClick: () => void;
  completed: boolean;
  className?: string;
}
