import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../utils';
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from '../tooltip/Tooltip';

const iconButtonVariants = cva('inline-flex items-center justify-center transition-colors cursor-pointer', {
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-7',
      lg: 'size-8'
    },
    variant: {
      neutral: 'text-text-secondary',
      inverted: 'text-primary-foreground',
      'subtle-brand-blue': 'text-text-secondary hover:bg-primary-soft active:bg-primary-soft'
    },
    shape: {
      round: 'rounded-full',
      rectangle: 'rounded'
    },
    fill: {
      // Empty strings are intentional: CVA requires all variant keys to have a value.
      // The actual styles are applied via compoundVariants (fill + variant combinations).
      solid: '',
      none: ''
    },
    disabled: {
      true: 'cursor-not-allowed text-faint',
      false: ''
    }
  },
  compoundVariants: [
    {
      variant: 'neutral',
      fill: 'solid',
      className: 'bg-hover hover:bg-hover active:bg-hover'
    },
    {
      variant: 'neutral',
      fill: 'none',
      className: 'hover:bg-hover active:bg-hover'
    },
    {
      variant: 'subtle-brand-blue',
      fill: 'solid',
      className: 'bg-primary-soft'
    },
    {
      variant: 'inverted',
      fill: 'solid',
      className: 'bg-surface/10 hover:bg-surface/20 active:bg-surface/25'
    },
    {
      variant: 'inverted',
      fill: 'none',
      className: 'hover:bg-surface/20 active:bg-surface/25'
    },
    {
      variant: 'neutral',
      fill: 'none',
      disabled: true,
      className: 'hover:bg-transparent active:bg-transparent'
    },
    {
      variant: 'subtle-brand-blue',
      fill: 'none',
      disabled: true,
      className: 'hover:bg-transparent active:bg-transparent'
    },
    {
      variant: 'subtle-brand-blue',
      fill: 'solid',
      disabled: true,
      className: 'bg-hover hover:bg-hover active:bg-hover'
    }
  ],
  defaultVariants: {
    size: 'md',
    variant: 'neutral',
    shape: 'round',
    fill: 'none'
  }
});

const iconSizes = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5'
} as const;

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof iconButtonVariants> {
  icon: LucideIcon;
  'aria-label': string;
  tooltipTitle?: string;
  disabled?: boolean;
  strokeWidth?: number;
  className?: string;
  onClick?: () => void;
}

export function IconButton({
  icon: Icon,
  size = 'md',
  variant = 'neutral',
  shape = 'round',
  fill = 'none',
  className,
  disabled,
  tooltipTitle,
  onClick,
  strokeWidth = 1.5,
  ...props
}: IconButtonProps) {
  const resolvedSize = size ?? 'md';
  const iconButton = (
    <button
      {...props}
      type="button"
      className={cn(iconButtonVariants({ size, variant, shape, fill, disabled: Boolean(disabled) }), className)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <Icon className={iconSizes[resolvedSize]} strokeWidth={strokeWidth} />
    </button>
  );
  if (tooltipTitle) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{iconButton}</TooltipTrigger>
        <TooltipContent className="py-1" align="center" side="top">
          <TooltipArrow />
          {tooltipTitle}
        </TooltipContent>
      </Tooltip>
    );
  }
  return iconButton;
}
