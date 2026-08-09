import React from 'react';
import cn from '../../utils/cn';
import { AutocompleteOption } from '../Autocomplete';

export interface SingleAutocompleteTriggerProps {
  selectedValue?: AutocompleteOption;
  placeholder: string;
  renderOption?: (option: AutocompleteOption, selectedValue?: boolean) => React.ReactNode;
  disabled: boolean;
  readOnly: boolean;
}

export function SingleAutocompleteTrigger({
  selectedValue,
  renderOption,
  placeholder,
  disabled,
  readOnly
}: SingleAutocompleteTriggerProps) {
  return selectedValue?.value ? (
    <span className={cn('text-text-primary truncate', { 'text-faint': disabled, 'text-text-primary': readOnly })}>
      {renderOption ? renderOption(selectedValue, true) : selectedValue.label}
    </span>
  ) : (
    <span className={cn('truncate text-text-secondary', { 'text-faint': disabled, 'text-text-primary': readOnly })}>{placeholder}</span>
  );
}
