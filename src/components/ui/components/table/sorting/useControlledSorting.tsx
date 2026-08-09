import { useState } from 'react';
import type { SortingState, TableOptions } from '@tanstack/react-table';
import { useSorting, type UseSortingOptions } from './useSorting';

export interface UseControlledSortingOptions extends UseSortingOptions {
  serverSide?: boolean;
}

export function useControlledSorting(options?: UseControlledSortingOptions): {
  sortingProps: Pick<TableOptions<unknown>, 'enableMultiSort' | 'enableSorting' | 'manualSorting' | 'onSortingChange' | 'state'>;
  setSortingState: (newState: SortingState) => void;
  sortingState: SortingState;
} {
  const { initialState, ...sortingProps } = useSorting(options).sortingProps;

  const [sortingState, setSortingState] = useState(initialState.sorting);

  return {
    setSortingState,
    sortingProps: {
      ...sortingProps,
      manualSorting: options?.serverSide,
      state: {
        sorting: sortingState
      },
      onSortingChange: setSortingState
    },
    sortingState
  };
}
