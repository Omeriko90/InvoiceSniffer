import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';
import { LoadingSpinner } from '../spinner/LoadingSpinner';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-1.5 px-3 rounded-lg text-2-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-strong active:bg-primary-strong',
        secondary: 'border border-border text-text-primary hover:bg-hover active:bg-hover',
        ghost: 'text-text-primary hover:bg-hover active:bg-hover'
      },
      // color must be declared here so cva recognizes it as a valid prop and
      // compoundVariants can match against it. Values are empty because the
      // actual styles differ per variant and are handled in compoundVariants below.
      color: {
        default: '',
        destructive: ''
      },
      size: {
        lg: 'h-[46px] px-5',
        md: 'h-[38px] py-[10px] px-4',
        sm: 'h-[32px] py-[10px]'
      },
      disabled: {
        true: 'bg-hover text-faint cursor-not-allowed',
        false: ''
      }
    },
    compoundVariants: [
      {
        variant: 'primary',
        color: 'destructive',
        class: 'bg-danger text-primary-foreground hover:bg-danger active:bg-danger'
      },
      {
        variant: 'secondary',
        color: 'destructive',
        class: 'border-danger text-danger hover:bg-danger-bg active:bg-danger-bg'
      },
      {
        variant: 'ghost',
        color: 'destructive',
        class: 'text-danger hover:bg-danger-bg active:bg-danger-bg'
      },
      // disabled + destructive overrides must come after the non-disabled destructive compounds
      // so that twMerge (used in cn()) resolves conflicts in their favour
      {
        variant: 'primary',
        color: 'destructive',
        disabled: true,
        class: 'bg-hover text-faint hover:bg-hover active:bg-hover'
      },
      {
        variant: 'secondary',
        color: 'destructive',
        disabled: true,
        class: 'bg-transparent border-border text-faint hover:bg-transparent active:bg-transparent'
      },
      {
        variant: 'ghost',
        color: 'destructive',
        disabled: true,
        class: 'bg-transparent text-faint hover:bg-transparent active:bg-transparent'
      },
      {
        variant: 'primary',
        color: 'default',
        disabled: true,
        class: 'bg-hover text-faint hover:bg-hover active:bg-hover'
      },
      {
        variant: 'secondary',
        color: 'default',
        disabled: true,
        class: 'bg-transparent border-border text-faint hover:bg-transparent active:bg-transparent'
      },
      {
        variant: 'ghost',
        color: 'default',
        disabled: true,
        class: 'text-faint bg-transparent hover:bg-transparent active:bg-transparent'
      }
    ],
    defaultVariants: {
      variant: 'primary',
      color: 'default',
      size: 'md',
      disabled: false
    }
  }
);

export type ButtonProps = Omit<React.HTMLAttributes<HTMLElement>, 'color'> &
  VariantProps<typeof buttonVariants> & {
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    isLoading?: boolean;
    disabled?: boolean;
    link?: string;
    target?: string;
    rel?: string;
    type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
    form?: React.ButtonHTMLAttributes<HTMLButtonElement>['form'];
    'data-testid'?: string;
  };

const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    variant,
    color,
    size,
    startIcon,
    endIcon,
    isLoading = false,
    disabled,
    className,
    children,
    link,
    target = '_blank',
    rel = 'noreferrer',
    type = 'button',
    onClick,
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;
  const Component = link ? 'a' : 'button';
  const componentProps = link
    ? {
        href: isDisabled ? undefined : link,
        target,
        rel,
        'aria-disabled': isDisabled || undefined
      }
    : {
        disabled: isDisabled,
        type
      };

  return (
    <Component
      ref={ref as React.Ref<HTMLAnchorElement & HTMLButtonElement>}
      className={cn(buttonVariants({ variant, color, size, disabled: !!disabled }), { 'pointer-events-none': isLoading }, className)}
      {...props}
      {...componentProps}
      onClick={disabled ? undefined : onClick}
    >
      <span className={cn('contents', { invisible: isLoading })}>
        {startIcon}
        {children}
        {endIcon}
      </span>
      {isLoading && <LoadingSpinner className="absolute" size={16} />}
    </Component>
  );
});

Button.displayName = 'Button';

export { Button };