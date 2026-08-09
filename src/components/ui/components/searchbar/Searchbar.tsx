import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../utils';
import { Input, type InputProps } from '../input/Input';
import { IconButton } from '../buttons/IconButton';

export interface SearchbarProps extends Omit<InputProps, 'onChange' | 'startAdornment' | 'endAdornment'> {
  onChange: (value: string) => void;
  onClear: () => void;
}

export function Searchbar({
  placeholder = 'Search...',
  value = '',
  onChange,
  onClear,
  size = 'sm',
  disabled,
  className,
  readOnly,
  ...rest
}: SearchbarProps) {
  const hasValue = Boolean(value);

  const searchIcon = (
    <Search
      size={16}
      strokeWidth={1.8}
      className={cn({
        'text-dim': !disabled && !hasValue,
        'text-text-primary': !disabled && hasValue,
        'text-faint': disabled
      })}
    />
  );

  const clearButton =
    hasValue && !(disabled || readOnly) ? (
      <IconButton icon={X} aria-label="Clear search" tooltipTitle="Clear search" size="lg" onClick={onClear} />
    ) : undefined;

  return (
    <Input
      type="text"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      size={size}
      startAdornment={searchIcon}
      endAdornment={clearButton}
      onChange={(value) => onChange(value)}
      className={cn('lg:w-[350px]', className)}
      {...rest}
    />
  );
}
