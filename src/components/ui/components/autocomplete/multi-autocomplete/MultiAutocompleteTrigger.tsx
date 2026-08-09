import React from 'react';
import { cn } from '../../utils/cn';
import { ChipGroup } from '../../chip/ChipGroup';
import { AutocompleteOption } from '../Autocomplete';

export interface MultiAutocompleteTriggerProps {
  selectedOptions: AutocompleteOption[];
  onRemove: (value: string) => void;
  maxVisibleChips: number;
  disabled: boolean;
  readOnly: boolean;
  placeholder: string;
  open: boolean;
}

export function MultiAutocompleteTrigger({
  selectedOptions,
  onRemove,
  maxVisibleChips,
  disabled,
  readOnly,
  placeholder,
  open
}: MultiAutocompleteTriggerProps) {
  const isNotInteractable = disabled || readOnly;

  return selectedOptions.length > 0 ? (
    <span className={cn('flex gap-1', open ? 'flex-wrap py-2' : 'overflow-hidden')}>
      <ChipGroup
        items={selectedOptions.map((opt) => ({ id: opt.value, label: opt.label }))}
        onRemove={!isNotInteractable ? onRemove : undefined}
        limitVisibleItems={maxVisibleChips}
        color={isNotInteractable ? 'neutral-strong' : undefined}
      />
    </span>
  ) : (
    <span className={'truncate text-text-secondary'}>{placeholder}</span>
  );
}
