import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../utils';

export type BadgeColor = 'brand-purple' | 'brand-blue' | 'negative' | 'brand-blue-subtle' | 'neutral';
export type BadgeVariant = 'outlined' | 'fill';

export type BadgeProps = {
  color?: BadgeColor;
  variant?: BadgeVariant;
  text: string;
  className?: string;
};

const badgeVariants = cva('inline-flex items-center h-5 px-1 rounded text-3-regular whitespace-nowrap', {
  variants: {
    color: {
      'brand-purple': 'bg-purple text-primary-foreground',
      'brand-blue': 'bg-primary text-primary-foreground',
      negative: 'bg-danger text-primary-foreground',
      'brand-blue-subtle': 'bg-primary-soft text-primary',
      neutral: 'bg-hover text-text-secondary'
    },
    variant: {
      outlined: 'border bg-transparent',
      fill: ''
    }
  },
  compoundVariants: [
    { color: 'brand-purple', variant: 'outlined', className: 'border-purple text-purple' },
    { color: 'brand-blue', variant: 'outlined', className: 'border-primary text-primary' },
    { color: 'negative', variant: 'outlined', className: 'border-danger text-danger' },
    { color: 'neutral', variant: 'outlined', className: 'border-border text-text-secondary' },
    { color: 'brand-blue-subtle', variant: 'outlined', className: 'border-primary' }
  ],
  defaultVariants: {
    color: 'brand-purple',
    variant: 'fill'
  }
});

export function Badge({ color, variant, text, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ color, variant }), className)}>{text}</span>;
}
