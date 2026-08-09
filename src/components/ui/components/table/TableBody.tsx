import React, { type ReactElement } from 'react';
import type { Row, Table as ReactTable } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { cn } from '../utils';
import { BaseTableBody, BaseTableRow, BaseTableCell } from './TableBaseComponents';

export interface TableBodyProps<TData> {
  table: ReactTable<TData>;
  loading?: boolean;
  onRowClick?: (row: Row<TData>) => void;
  enableColumnSizing?: boolean;
  className?: string;
}

export function TableBody<TData>({ table, loading, onRowClick, enableColumnSizing, className }: TableBodyProps<TData>): ReactElement {
  return (
    <BaseTableBody className={cn('block h-full overflow-y-auto', className, { 'opacity-10 pointer-events-none': loading })}>
      {table.getRowModel().rows.map((row) => {
        const cells = row.getVisibleCells();
        return (
          <BaseTableRow
            key={row.id}
            className={cn('table table-fixed w-full', { 'cursor-pointer': onRowClick || row.getCanSelect() })}
            onClick={() => {
              if (row.getCanSelect()) {
                row.toggleSelected();
              }
              onRowClick?.(row);
            }}
          >
            {cells.map((cell, index) => (
              <BaseTableCell
                key={cell.id}
                align={cell.column.columnDef.meta?.align}
                data-testid={cell.column.id}
                style={enableColumnSizing && cell.column.getSize() ? { width: cell.column.getSize() } : undefined}
                className={cn({
                  'group-hover:bg-primary-soft': onRowClick || row.getCanSelect(),
                  'bg-primary-soft group-hover:bg-primary-soft': row.getIsSelected(),
                  'group-hover:rounded-l-md': index === 0,
                  'group-hover:rounded-r-md': index === cells.length - 1,
                  'rounded-l-md': row.getIsSelected() && index === 0,
                  'rounded-r-md': row.getIsSelected() && index === cells.length - 1
                })}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </BaseTableCell>
            ))}
          </BaseTableRow>
        );
      })}
    </BaseTableBody>
  );
}
