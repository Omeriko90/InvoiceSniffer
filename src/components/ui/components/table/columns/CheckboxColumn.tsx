import React from 'react';
import { Checkbox } from '../../checkbox/Checkbox';

export interface CheckboxColumnProps {
  checked: boolean | 'indeterminate';
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
}

export function CheckboxColumn({ checked, disabled, onCheckedChange, ariaLabel }: CheckboxColumnProps) {
  return <Checkbox checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} aria-label={ariaLabel} />;
}
