import React, { type ReactElement } from 'react';
import type { Table as ReactTable } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { cn } from '../utils';
import { mapAlignToFlex } from './utils/react.table.utils';
import { BaseTableHeader, BaseTableRow, BaseTableHead } from './TableBaseComponents';
import { TableSortIcon } from './TableSortIcon';
import { TableLoadingBar } from './TableLoadingBar';

export interface TableHeaderProps<TData> {
  table: ReactTable<TData>;
  enableColumnSizing?: boolean;
  className?: string;
  loading?: boolean;
}

function _sortTitle(nextSortingOrder: 'asc' | 'desc' | false): string {
  switch (nextSortingOrder) {
    case 'asc':
      return 'Sort ascending';
    case 'desc':
      return 'Sort descending';
    default:
      return 'Clear sort';
  }
}

export function TableHeader<TData>({ table, enableColumnSizing, className, loading }: TableHeaderProps<TData>): ReactElement {
  return (
    <BaseTableHeader className={cn('relative', className)}>
      {loading && <TableLoadingBar />}
      {table.getHeaderGroups().map((headerGroup) => (
        <BaseTableRow key={headerGroup.id} className="table table-fixed w-full">
          {headerGroup.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const align = mapAlignToFlex(header.column.columnDef.meta?.align);
            const style = enableColumnSizing && header.column.getSize() ? { width: header.column.getSize() } : undefined;

            return (
              <BaseTableHead key={header.id} className={cn(align)} style={style}>
                {header.isPlaceholder ? null : canSort ? (
                  <div
                    className={cn('flex items-center gap-1.5 cursor-pointer select-none group/sort', align)}
                    onClick={header.column.getToggleSortingHandler()}
                    title={_sortTitle(header.column.getNextSortingOrder())}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <TableSortIcon sorted={header.column.getIsSorted()} />
                  </div>
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                )}
              </BaseTableHead>
            );
          })}
        </BaseTableRow>
      ))}
    </BaseTableHeader>
  );
}
