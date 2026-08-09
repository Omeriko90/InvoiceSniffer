import type { SortingFn, SortingState, TableOptions } from '@tanstack/react-table';

export interface UseSortingOptions {
  disabled?: boolean;
  initialState?: SortingState;
  multiColumn?:
    | boolean
    | {
        allowRemoval?: boolean;
        maxColumns?: number;
      };
  sortDescFirst?: boolean;
  sortingFns?: Record<string, SortingFn<unknown>>;
}

export function useSorting(options?: UseSortingOptions): {
  sortingProps: Pick<
    TableOptions<unknown>,
    'enableMultiSort' | 'enableSorting' | 'enableSortingRemoval' | 'maxMultiSortColCount' | 'sortDescFirst' | 'sortingFns'
  > & {
    initialState: {
      sorting: SortingState;
    };
  };
} {
  const { initialState, multiColumn } = options || {};

  return {
    sortingProps: {
      enableMultiSort: multiColumn !== false,
      enableSorting: options?.disabled !== true,
      enableSortingRemoval: false,
      initialState: {
        sorting: initialState || []
      },
      ...(typeof multiColumn === 'object'
        ? {
            allowMultiRemoval: multiColumn.allowRemoval,
            maxMultiSortColCount: multiColumn.maxColumns
          }
        : undefined),
      sortingFns: options?.sortingFns
    }
  };
}
