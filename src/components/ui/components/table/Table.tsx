import React, { type ReactElement } from 'react';
import type { Row, Table as ReactTable } from '@tanstack/react-table';
import { cn } from '../utils';
import { BaseTableElement } from './TableBaseComponents';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TableEmptyState } from './TableEmptyState';
import { TableFooter } from './TableFooter';
import { Paginator } from '../paginator';

export interface TableProps<TData> {
  dataTestId?: string;
  table: ReactTable<TData>;
  loading?: boolean;
  onRowClick?: (row: Row<TData>) => void;
  isFixedLayout?: boolean;
  rightPaginatorContent?: React.ReactNode;
  className?: string;
  enableColumnSizing?: boolean;
  tableClassNames?: { table?: string; tableBody?: string; tableHeader?: string; tableFooter?: string; tableEmptyState?: string };
}

export function Table<TData>(props: TableProps<TData>): ReactElement {
  const {
    table,
    loading,
    dataTestId,
    className,
    onRowClick,
    isFixedLayout,
    enableColumnSizing,
    rightPaginatorContent,
    tableClassNames = { table: '', tableBody: '', tableHeader: '', tableFooter: '' }
  } = props;

  // options.state/initialState can't be used to detect pagination — the react adapter
  // merges TanStack's default pagination state into options.state for every table
  const withPagination = Boolean(table.options.getPaginationRowModel || table.options.manualPagination);
  const showEmptyState = !table.getRowModel().rows.length && !loading;
  const hasFooter = table.getFooterGroups().some((fg) => fg.headers.some((h) => h.column.columnDef.footer));
  const {
    table: tableClassName,
    tableBody: tableBodyClassName,
    tableHeader: tableHeaderClassName,
    tableFooter: tableFooterClassName
  } = tableClassNames;

  return (
    <div className={cn('flex flex-col h-full', className)} data-testid={dataTestId}>
      <div className="relative h-full overflow-x-auto">
        <BaseTableElement className={cn('h-full', tableClassName, { 'table-fixed': isFixedLayout })}>
          {showEmptyState ? (
            <TableEmptyState columnCount={table.getAllColumns().length} />
          ) : (
            <>
              <TableHeader loading={loading} table={table} enableColumnSizing={enableColumnSizing} className={tableHeaderClassName} />
              <TableBody
                table={table}
                loading={loading}
                onRowClick={onRowClick}
                enableColumnSizing={enableColumnSizing}
                className={tableBodyClassName}
              />
              {hasFooter && <TableFooter table={table} className={tableFooterClassName} />}
            </>
          )}
        </BaseTableElement>
      </div>

      {withPagination && (
        <div className="flex flex-col gap-5 mt-auto">
          <hr className="border-0 border-b border-hover m-0" />
          <div className="flex justify-between">
            <Paginator
              onPageIndexChange={(pageIndex) => table.setPageIndex(pageIndex)}
              pageIndex={table.getState().pagination.pageIndex}
              totalItems={table.getRowCount()}
              totalPages={table.getPageCount()}
              pageSize={table.getState().pagination.pageSize}
            />
            {rightPaginatorContent}
          </div>
        </div>
      )}
    </div>
  );
}
