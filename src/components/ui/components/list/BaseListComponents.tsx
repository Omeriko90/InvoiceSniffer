import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const baseListVariants = cva('flex flex-col overflow-y-auto', {
  variants: {
    variant: {
      outlined: 'border border-hover rounded-2xl',
      filled: 'rounded-lg'
    }
  },
  defaultVariants: { variant: 'outlined' }
});

export type BaseListProps = React.ComponentPropsWithoutRef<'div'> & VariantProps<typeof baseListVariants>;

function BaseList({ variant, className, ...props }: BaseListProps) {
  return <div data-slot="base-list" className={cn(baseListVariants({ variant }), className)} {...props} />;
}

const baseListItemVariants = cva('flex items-center justify-between', {
  variants: {
    variant: {
      outlined: '[&:not(:last-child)]:border-b [&:not(:last-child)]:border-hover',
      filled: 'bg-hover [&:not(:last-child)]:border-b-2 [&:not(:last-child)]:border-surface'
    },
    padding: {
      sm: 'px-4 py-3',
      md: 'px-5 py-4'
    }
  },
  defaultVariants: { variant: 'outlined', padding: 'sm' }
});

export type BaseListItemProps = React.ComponentPropsWithoutRef<'div'> & VariantProps<typeof baseListItemVariants>;

function BaseListItem({ variant, padding, className, ...props }: BaseListItemProps) {
  return <div data-slot="base-list-item" className={cn(baseListItemVariants({ variant, padding }), className)} {...props} />;
}

export { BaseList, BaseListItem };
