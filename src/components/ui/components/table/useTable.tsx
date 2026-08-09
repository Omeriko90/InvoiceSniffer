import {
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type Table,
  type TableOptions
} from '@tanstack/react-table';
import type { SetOptional } from 'type-fest';
import { HoverFeature } from './hovering/HoveringFeature';

export type TableOptionsX<TData> = SetOptional<TableOptions<TData>, 'getCoreRowModel'>;

export function useTable<TData>(
  options: TableOptionsX<TData>,
  ...moreOptions: Partial<TableOptions<TData>>[]
): {
  table: Table<TData>;
} {
  const baseTableOptions = {
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: false,
    _features: [HoverFeature],
    defaultColumn: { enableSorting: false }
  };

  const tableOptions = [options, ...moreOptions].reduce(
    (acc, opts) => ({
      ...acc,
      ...opts,
      initialState: (acc.initialState || opts.initialState) && {
        ...acc.initialState,
        ...opts.initialState
      },
      state: (acc.state || opts.state) && {
        ...acc.state,
        ...opts.state
      }
    }),
    baseTableOptions as TableOptions<TData>
  ) as TableOptions<TData>;

  if ((tableOptions.initialState?.pagination || tableOptions.state?.pagination) && !tableOptions.manualPagination) {
    tableOptions.getPaginationRowModel ||= getPaginationRowModel();
  }

  if ((tableOptions.initialState?.sorting || tableOptions.state?.sorting) && !tableOptions.manualSorting) {
    tableOptions.getSortedRowModel ||= getSortedRowModel();
  }

  if ((tableOptions.initialState?.expanded || tableOptions.state?.expanded) && !tableOptions.manualExpanding) {
    tableOptions.getExpandedRowModel ||= getExpandedRowModel();
  }
  const table = useReactTable(tableOptions);

  return {
    table
  };
}
