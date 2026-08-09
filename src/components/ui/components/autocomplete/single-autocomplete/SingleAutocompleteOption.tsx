import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';
import { AutocompleteOption } from '../Autocomplete';

export interface SingleAutocompleteOptionProps {
  option: AutocompleteOption;
  selected: boolean;
  renderOption?: (option: AutocompleteOption) => React.ReactNode;
}

export function SingleAutocompleteOption({ option, selected, renderOption }: SingleAutocompleteOptionProps) {
  return (
    <>
      <span className="text-sm text-text-primary">{renderOption ? renderOption(option) : option.label}</span>
      {selected && <Check strokeWidth={1.5} size={20} className={cn('size-5 text-primary shrink-0')} />}
    </>
  );
}
