import React from 'react';
import { BaseTableFooter, BaseTableHead, BaseTableRow } from './TableBaseComponents';
import { flexRender } from '@tanstack/react-table';
import type { Table as ReactTable } from '@tanstack/react-table';

export interface TableFooterProps<TData> {
  table: ReactTable<TData>;
  className?: string;
}

export function TableFooter<TData>({ table, className }: TableFooterProps<TData>) {
  return (
    <BaseTableFooter className={className}>
      {table.getFooterGroups().map((footerGroup) => (
        <BaseTableRow key={footerGroup.id} className="table table-fixed w-full">
          {footerGroup.headers.map((header) => (
            <BaseTableHead key={header.id}>
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
            </BaseTableHead>
          ))}
        </BaseTableRow>
      ))}
    </BaseTableFooter>
  );
}
