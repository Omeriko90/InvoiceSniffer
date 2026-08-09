import * as React from 'react';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils';

export type InputVariant = 'outlined' | 'empty';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  label?: string;
  required?: boolean;
  hint?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  error?: boolean;
  size?: 'sm' | 'md';
  variant?: InputVariant;
  className?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  onChange?: (value: string) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    inputClassName,
    className,
    label,
    required,
    hint,
    startAdornment,
    endAdornment,
    error,
    size = 'sm',
    variant = 'outlined',
    inputWrapperClassName,
    disabled,
    readOnly,
    onChange,
    ...props
  },
  ref
) {
  const isInteractive = !disabled && !readOnly;
  const isOutlined = variant === 'outlined';
  const hideArrowsInNumberTypeInputCss =
    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  const internalInputWrapperClassName = cn(
    'flex items-center gap-2 px-3 rounded-lg bg-primary',
    'border-border h-[38px]',
    {
      'border': isOutlined,
      'h-[46px]': size === 'md' && isOutlined,
      'px-0 h-[24px]': !isOutlined,
      'pr-2': !!endAdornment,
      '[&:hover:not(:focus-within)]:border-border focus-within:border-primary': isInteractive && !error,
      'border-danger': error,
      'bg-hover': disabled && isOutlined,
      'cursor-not-allowed': disabled,
      'bg-hover border-transparent': readOnly && isOutlined
    },
    inputWrapperClassName
  );

  const internalInputClassName = cn(
    'flex-1 min-w-0 bg-transparent outline-none',
    isOutlined ? 'text-2-regular' : 'heading-sm-regular',
    hideArrowsInNumberTypeInputCss,
    'text-text-primary placeholder:text-dim',
    'disabled:text-faint disabled:placeholder:text-faint disabled:cursor-not-allowed',
    inputClassName
  );

  const hintColor = disabled ? 'text-faint' : error ? 'text-danger' : 'text-text-secondary';
  const hintClassName = cn('text-2-regular', hintColor);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={cn('flex flex-col gap-1 w-full', className)}>
      {label && (
        <label className="text-2-regular text-text-primary">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div className={internalInputWrapperClassName}>
        {startAdornment && <span className="shrink-0 flex items-center">{startAdornment}</span>}

        <input
          ref={ref}
          disabled={disabled}
          readOnly={readOnly}
          className={internalInputClassName}
          onChange={readOnly || disabled ? undefined : handleChange}
          {...props}
        />

        {endAdornment}
      </div>

      {hint && <p className={hintClassName}>{hint}</p>}
    </div>
  );
});

export { Input };