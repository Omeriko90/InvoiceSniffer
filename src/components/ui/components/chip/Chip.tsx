import React from 'react';
import { X } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '../utils';
import { IconButton } from '../buttons/IconButton';

export type ChipColor = 'neutral' | 'success' | 'active' | 'error' | 'warning' | 'inverted' | 'neutral-strong';

export type ChipProps = {
  color?: ChipColor;
  startElement?: React.ReactNode;
  text: string;
  onRemove?: () => void;
  className?: string;
};

const chipVariants = cva('inline-flex items-center whitespace-nowrap rounded-full h-6 gap-1 text-sm font-normal', {
  variants: {
    color: {
      neutral: 'bg-hover text-text-primary',
      'neutral-strong': 'bg-border text-text-primary',
      success: 'bg-success-bg text-success',
      active: 'bg-primary-soft text-primary',
      error: 'bg-danger-bg text-danger',
      warning: 'bg-warning text-warning',
      inverted: 'bg-primary text-text-primary border border-border'
    }
  },
  defaultVariants: {
    color: 'neutral'
  }
});

export function Chip({ color = 'neutral', startElement, text, onRemove, className }: ChipProps) {
  const hasRemove = !!onRemove;

  const paddingClass = startElement ? 'pl-1 pr-1.5' : hasRemove ? 'pl-2 pr-1.5' : 'px-2';

  return (
    <span className={cn(chipVariants({ color }), paddingClass, className)}>
      {startElement}
      <span className="text-2-regular">{text}</span>
      {hasRemove && <IconButton size="sm" icon={X} strokeWidth={2} aria-label="Remove" onClick={onRemove} />}
    </span>
  );
}
