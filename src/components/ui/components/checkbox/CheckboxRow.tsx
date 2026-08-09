import { cn } from '../utils';
import { Checkbox } from './Checkbox';
import React from 'react';

export interface CheckboxRowProps {
  children: React.ReactNode;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  checkboxClassName?: string;
}

function CheckboxRow({ children, checked, onCheckedChange, className, checkboxClassName }: CheckboxRowProps) {
  const handleCheckboxChange = (checked: boolean) => {
    onCheckedChange?.(checked);
  };

  const handleCheckboxContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      onCheckedChange?.(!checked);
    }
  };
  return (
    <div className={cn('flex items-center', className)} onClick={() => onCheckedChange?.(!checked)}>
      <div className={cn('w-[40px] flex items-center', checkboxClassName)} onClick={handleCheckboxContainerClick}>
        <Checkbox checked={checked} onCheckedChange={handleCheckboxChange} />
      </div>
      {children}
    </div>
  );
}

export { CheckboxRow };