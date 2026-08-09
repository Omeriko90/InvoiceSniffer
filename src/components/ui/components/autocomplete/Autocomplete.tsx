import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverContentProps, PopoverTrigger } from '@radix-ui/react-popover';
import { cva } from 'class-variance-authority';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandLoading } from '../command/Command';
import { LoadingSpinner } from '../spinner/LoadingSpinner';
import { cn } from '../utils/cn';
import { Searchbar } from '../searchbar';
import { MultiAutocompleteTrigger } from './multi-autocomplete/MultiAutocompleteTrigger';
import { SingleAutocompleteTrigger } from './single-autocomplete/SingleAutocompleteTrigger';
import { SingleAutocompleteOption } from './single-autocomplete/SingleAutocompleteOption';
import { MultiAutocompleteOption } from './multi-autocomplete/MultiAutocompleteOption';

const triggerVariants = cva(
  'flex w-full items-center justify-between rounded-lg border px-3 text-left text-sm transition-colors min-h-[38px]',
  {
    variants: {
      variant: {
        outlined: '',
        ghost: 'border-0 px-2'
      },
      size: {
        small: 'min-h-[32px]',
        medium: '',
        large: 'min-h-[46px]'
      },
      disabled: {
        true: 'text-faint cursor-not-allowed',
        false: ''
      },
      readOnly: {
        true: 'bg-hover border-0 cursor-default',
        false: ''
      },
      error: {
        true: '',
        false: ''
      }
    },
    compoundVariants: [
      { variant: 'ghost', disabled: false, class: 'hover:bg-hover data-[state=open]:bg-hover' },
      { variant: 'outlined', disabled: true, class: 'bg-hover border-border' },
      { error: true, disabled: false, readOnly: false, class: 'border-danger' },
      { error: false, disabled: false, readOnly: false, class: 'border-border hover:border-border' }
    ],
    defaultVariants: {
      variant: 'outlined',
      size: 'medium',
      disabled: false,
      readOnly: false,
      error: false
    }
  }
);

export type AutocompleteOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export interface AutocompleteProps {
  // Config
  size?: 'small' | 'medium' | 'large';
  error?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  renderOption?: (option: AutocompleteOption, selectedValue?: boolean) => React.ReactNode;
  className?: string;
  popoverContentClassName?: string;
  popoverContentProps?: PopoverContentProps;
  label?: string;
  placeholder?: string;
  variant?: 'outlined' | 'ghost';
  searchable?: boolean;
  options: AutocompleteOption[];
  isLoading?: boolean;
  onSearchValueChange?: (value: string) => void;

  // Single-select
  value?: AutocompleteOption;
  onChange?: (value: AutocompleteOption) => void;

  // Multi-select
  multiple?: boolean;
  values?: AutocompleteOption[];
  onMultiChange?: (values: AutocompleteOption[]) => void;
  maxVisibleChips?: number;
}

export function Autocomplete({
  label,
  placeholder = 'Select...',
  options,
  value,
  onChange,
  variant = 'outlined',
  multiple = false,
  values,
  onMultiChange,
  size = 'medium',
  error = false,
  searchable = false,
  disabled = false,
  readOnly = false,
  maxVisibleChips = 2,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results.',
  isLoading = false,
  className,
  onSearchValueChange,
  renderOption,
  popoverContentClassName,
  popoverContentProps
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const multiSelectedOptionValues = useMemo(() => values?.map((o) => o?.value) ?? [], [values]);

  const triggerClass = cn(triggerVariants({ variant, size, disabled, readOnly, error }), className);

  const handleSingleSelect = (optionValue: AutocompleteOption) => {
    onChange?.(optionValue.value === value?.value ? ({ value: '', label: '' } as AutocompleteOption) : optionValue);
    setOpen(false);
    handleSearchValueChange('');
  };

  const handleMultiSelect = (optionValue: AutocompleteOption) => {
    const currentValues = values ? values.map((it) => it.value) : [];
    const next = currentValues.includes(optionValue.value)
      ? (values?.filter((it) => it.value !== optionValue.value) ?? [])
      : [...(values ?? []), optionValue];

    onMultiChange?.(next);
  };

  const handleSearchValueChange = (value: string) => {
    setSearchValue(value);
    onSearchValueChange?.(value);
  };

  const handleRemoveAutocompleteTag = (optionValue: string) => {
    const currentValues = values ?? [];
    const next = currentValues.filter((it) => it.value !== optionValue);

    onMultiChange?.(next);
    if (!open) {
      setOpen(true);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled || readOnly) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      handleSearchValueChange('');
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-2-regular text-text-primary">{label}</span>}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger className={triggerClass} disabled={disabled} aria-expanded={open}>
          <span className={cn('flex min-w-0 flex-1 gap-1')}>
            {multiple ? (
              <MultiAutocompleteTrigger
                selectedOptions={values || []}
                onRemove={handleRemoveAutocompleteTag}
                maxVisibleChips={maxVisibleChips}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={placeholder}
                open={open}
              />
            ) : (
              <SingleAutocompleteTrigger
                selectedValue={value}
                renderOption={renderOption}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
              />
            )}
          </span>
          {!readOnly && (
            <ChevronDown
              strokeWidth={1.3}
              className={cn('ml-3 size-5 shrink-0 text-text-secondary transition-transform duration-200', {
                'rotate-180': open,
                'ml-2': variant === 'ghost',
                'text-faint': disabled
              })}
            />
          )}
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            'bg-surface border border-border rounded-2xl p-3 max-h-[280px] shadow-[0px_6px_16px_-4px_rgba(0,0,0,0.1)] z-50 overflow-hidden flex flex-col min-w-[220px] w-fit',
            popoverContentClassName
          )}
          align="start"
          sideOffset={4}
          {...popoverContentProps}
        >
          <Command
            filter={(value, search, keywords) => {
              const q = search.toLowerCase();
              if (value.toLowerCase().includes(q)) return 1;
              if (keywords?.some((k) => k.toLowerCase().includes(q))) return 1;
              return 0;
            }}
          >
            {searchable && (
              <CommandInput value={searchValue} className="ml-0" asChild minimal>
                <Searchbar
                  value={searchValue}
                  onChange={handleSearchValueChange}
                  placeholder={searchPlaceholder}
                  onClear={() => handleSearchValueChange('')}
                  className="lg:w-auto"
                />
              </CommandInput>
            )}
            <CommandList className={cn('mt-3 overflow-y-auto py-0', { 'mt-0': !searchable })}>
              {isLoading && (
                <CommandLoading>
                  <LoadingSpinner size={20} />
                </CommandLoading>
              )}
              {!isLoading && <CommandEmpty>{emptyMessage}</CommandEmpty>}
              {!searchValue && (values?.length || 0) > 0 && (
                <CommandGroup heading="Selected">
                  {values?.map((option) => {
                    return (
                      <CommandItem
                        key={option.value}
                        value={`selected::${option.label}`}
                        onSelect={multiple ? () => handleMultiSelect(option) : () => handleSingleSelect(option)}
                        className={'h-auto m-0 rounded-[4px] hover:bg-primary-soft hover:bg-opacity-100'}
                      >
                        {multiple ? (
                          <MultiAutocompleteOption
                            option={option}
                            selected
                            onCheckedChange={() => handleMultiSelect(option)}
                            renderOption={renderOption}
                          />
                        ) : (
                          <SingleAutocompleteOption option={option} selected renderOption={renderOption} />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              <CommandGroup heading={multiple ? 'Available' : undefined}>
                {options.map((option) => {
                  const isSelected = multiple ? multiSelectedOptionValues.includes(option.value) : value?.value === option.value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      keywords={[option.value]}
                      onSelect={multiple ? () => handleMultiSelect(option) : () => handleSingleSelect(option)}
                      className={'h-auto m-0 rounded-[4px] hover:bg-primary-soft hover:bg-opacity-100'}
                      disabled={option.disabled}
                    >
                      {multiple ? (
                        <MultiAutocompleteOption
                          option={option}
                          selected={isSelected}
                          onCheckedChange={() => handleMultiSelect(option)}
                          renderOption={renderOption}
                        />
                      ) : (
                        <SingleAutocompleteOption option={option} selected={isSelected} renderOption={renderOption} />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
