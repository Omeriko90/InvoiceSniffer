import React from 'react';
import { cn } from '../utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

export function TableSortIcon({ sorted }: { sorted: 'asc' | 'desc' | false }) {
  switch (sorted) {
    case 'desc':
      return <ArrowDown size={14} />;
    default:
      return <ArrowUp size={14} className={cn({ 'opacity-0 group-hover/sort:opacity-100 transition-opacity': sorted !== 'asc' })} />;
  }
}
