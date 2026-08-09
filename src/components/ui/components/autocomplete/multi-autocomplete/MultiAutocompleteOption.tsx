import React from 'react';
import { AutocompleteOption } from '../Autocomplete';
import { CheckboxRow } from '../../checkbox/CheckboxRow';

export interface MultiAutocompleteOptionProps {
  option: AutocompleteOption;
  selected: boolean;
  renderOption?: (option: AutocompleteOption) => React.ReactNode;
  onCheckedChange?: () => void;
}

export function MultiAutocompleteOption({ option, selected, onCheckedChange, renderOption }: MultiAutocompleteOptionProps) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <CheckboxRow checked={selected} checkboxClassName="w-fit" className="gap-3" onCheckedChange={() => onCheckedChange?.()}>
        <span className="text-sm text-text-primary">{renderOption ? renderOption(option) : option.label}</span>
      </CheckboxRow>
    </div>
  );
}
