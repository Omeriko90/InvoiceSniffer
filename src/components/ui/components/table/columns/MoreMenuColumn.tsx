import React from 'react';
import { MoreMenu, MenuItemOption } from '../../menu/MoreMenu';

export interface MoreMenuColumnProps {
  menuItems: MenuItemOption[];
  onSelect: (item: string) => void;
  disabled?: boolean;
}

export function MoreMenuColumn({ menuItems, onSelect, disabled }: MoreMenuColumnProps) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <MoreMenu menuItems={menuItems} onSelect={onSelect} disabled={disabled} iconButtonProps={{ variant: 'subtle-brand-blue' }} />
    </div>
  );
}
