import React from 'react';
import { ChevronLeft, ChevronRight, ChevronFirst, ChevronLast } from 'lucide-react';
import { IconButton } from '../buttons/IconButton';
import { cn } from '../utils';
import { formatNumber } from '../helpers/formatters';

export interface PaginatorProps {
  pageIndex: number;
  onPageIndexChange?: (pageIndex: number) => void;
  totalItems: number;
  totalPages: number;
  pageSize: number;
  className?: string;
}

export function Paginator({ pageIndex, onPageIndexChange, totalItems, totalPages, pageSize, className }: PaginatorProps) {
  const canPrevious = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;
  const minRowIndex = pageIndex * pageSize + 1;
  const maxRowIndex = Math.min(pageIndex * pageSize + pageSize, totalItems);
  const totalPagesFormatted = formatNumber(totalPages);
  const pageIndexFormatted = formatNumber(pageIndex + 1);
  const minRowIndexFormatted = formatNumber(minRowIndex);
  const maxRowIndexFormatted = formatNumber(maxRowIndex);
  const totalItemsFormatted = formatNumber(totalItems);

  const summary =
    totalPages > 1 ? `Showing ${minRowIndexFormatted}–${maxRowIndexFormatted} of ${totalItemsFormatted}` : `Showing ${totalItemsFormatted}`;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-2">
        <IconButton
          icon={ChevronFirst}
          size="lg"
          aria-label="First page"
          disabled={!canPrevious}
          onClick={() => onPageIndexChange?.(0)}
        />
        <IconButton
          icon={ChevronLeft}
          size="lg"
          aria-label="Previous page"
          disabled={!canPrevious}
          onClick={() => onPageIndexChange?.(pageIndex - 1)}
        />
        <span className="w-fit min-w-[55px] text-center text-2-regular text-text-secondary">
          {pageIndexFormatted} / {totalPagesFormatted}
        </span>
        <IconButton
          icon={ChevronRight}
          size="lg"
          aria-label="Next page"
          disabled={!canNext}
          onClick={() => onPageIndexChange?.(pageIndex + 1)}
        />
        <IconButton
          icon={ChevronLast}
          size="lg"
          aria-label="Last page"
          disabled={!canNext}
          onClick={() => onPageIndexChange?.(totalPages - 1)}
        />
      </div>
      <span className="text-2-regular text-dim whitespace-nowrap">{summary}</span>
    </div>
  );
}
