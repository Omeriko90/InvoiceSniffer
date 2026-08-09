import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { IconButton } from '../../buttons/IconButton';
import { SeparatorRow } from '../../separator-row/SeparatorRow';

export interface ActionsColumnItem {
  icon: LucideIcon;
  'aria-label': string;
  onClick?: () => void;
  disabled?: boolean;
  tooltipTitle?: string;
}

export interface ActionsColumnProps {
  items: ActionsColumnItem[];
}

export function ActionsColumn({ items }: ActionsColumnProps) {
  return (
    <div
      className="invisible group-hover:visible transition-[visibility] ease-[cubic-bezier(0.4,0,0.2,1)] duration-[400ms]"
      onClick={(e) => e.stopPropagation()}
    >
      <SeparatorRow separatorHeight="0.75rem">
        {items.map((item, index) => (
          <IconButton
            key={`${item['aria-label'].replace(' ', '-').toLowerCase()}-${index}`}
            icon={item.icon}
            onClick={item.onClick}
            disabled={item.disabled}
            shape="rectangle"
            variant="subtle-brand-blue"
            tooltipTitle={item.tooltipTitle}
            aria-label={item['aria-label']}
          />
        ))}
      </SeparatorRow>
    </div>
  );
}
