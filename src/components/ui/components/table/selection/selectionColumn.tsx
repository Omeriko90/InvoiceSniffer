import React from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { CheckboxColumn } from '../columns/CheckboxColumn';

export function selectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    size: 40,
    header: ({ table }) => (
      <CheckboxColumn
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
        ariaLabel="Select all"
      />
    ),
    cell: ({ row }: { row: Row<TData> }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <CheckboxColumn
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
          ariaLabel="Select row"
        />
      </div>
    )
  };
}
