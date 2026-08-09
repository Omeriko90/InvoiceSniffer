import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './Menu';
import { IconButton, IconButtonProps } from '../buttons/IconButton';
import { Ellipsis } from 'lucide-react';

export interface MenuItemOption {
  value: string;
  text: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface MoreMenuProps {
  menuItems: MenuItemOption[];
  onSelect: (item: string) => void;
  trigger?: React.JSX.Element;
  disabled?: boolean;
  iconButtonProps?: {
    variant?: IconButtonProps['variant'];
    shape?: IconButtonProps['shape'];
    size?: IconButtonProps['size'];
    strokeWidth?: IconButtonProps['strokeWidth'];
  };
}

export function MoreMenu({ menuItems, onSelect, disabled, iconButtonProps }: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={() => setOpen(false)} />}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger disabled={disabled} className="w-[38px]" data-testid="more-menu-trigger">
          <IconButton
            icon={Ellipsis}
            disabled={disabled}
            strokeWidth={2}
            shape="rectangle"
            aria-label="More"
            size="lg"
            {...iconButtonProps}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {menuItems.map((item) => (
            <DropdownMenuItem
              key={item.value}
              data-testid={`menu-item-${item.value}`}
              onClick={() => onSelect(item.value)}
              disabled={item.disabled}
            >
              {item.icon}
              {item.text}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
