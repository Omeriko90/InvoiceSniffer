import { useState } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';

export function useRowSelection() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  return {
    rowSelectionProps: {
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
      state: { rowSelection }
    },
    rowSelection,
    setRowSelection
  };
}
