import * as React from 'react';
import { BaseList, BaseListItem } from './BaseListComponents';

export type ListItem = {
  key: string;
  content: React.ReactNode;
};

export type ListProps = {
  items: ListItem[];
  variant?: 'outlined' | 'filled';
  padding?: 'sm' | 'md';
  className?: string;
};

function List({ items, variant = 'outlined', padding = 'sm', className }: ListProps) {
  return (
    <BaseList variant={variant} className={className}>
      {items.map((item) => (
        <BaseListItem key={item.key} variant={variant} padding={padding}>
          {item.content}
        </BaseListItem>
      ))}
    </BaseList>
  );
}

export { List };
