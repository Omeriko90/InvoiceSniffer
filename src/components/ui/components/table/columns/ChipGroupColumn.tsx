import React from 'react';
import { ChipGroup, ChipGroupItem, ChipGroupProps } from '../../chip/ChipGroup';

export interface ChipGroupColumnProps {
  items: ChipGroupItem[];
  limitVisibleItems?: number;
  color?: ChipGroupProps['color'];
}

export function ChipGroupColumn({ items, limitVisibleItems = 2, color }: ChipGroupColumnProps) {
  return <ChipGroup items={items} limitVisibleItems={limitVisibleItems} color={color} />;
}
