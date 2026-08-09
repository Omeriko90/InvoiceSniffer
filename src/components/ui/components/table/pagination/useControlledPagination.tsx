import { useCallback, useEffect, useState } from 'react';
import type { PaginationState, TableOptions } from '@tanstack/react-table';
import { usePagination, UsePaginationOptions } from './usePagination';

export interface ControlledPaginationOptions extends UsePaginationOptions {
  serverSide?: boolean;
  totalItems?: number;
  pageIndex: number;
  onPageIndexChange?: (pageIndex: number) => void;
}

export function useControlledPagination(options: ControlledPaginationOptions): {
  paginationProps: Pick<TableOptions<unknown>, 'autoResetPageIndex' | 'manualPagination' | 'onPaginationChange' | 'rowCount' | 'state'>;
  paginationState: PaginationState;
  resetPageIndex: () => void;
  setPaginationState: (newState: PaginationState) => void;
} {
  const {
    initialState: { pagination: initialPaginationState },
    ...paginationProps
  } = usePagination(options).paginationProps;

  const [paginationState, setPaginationState] = useState(initialPaginationState);

  // Sync the controlled `pageIndex` prop into internal state when it changes,
  // during render rather than in an effect — avoids the cascading re-render
  // that setState-in-effect causes. https://react.dev/learn/you-might-not-need-an-effect
  const [prevControlledPageIndex, setPrevControlledPageIndex] = useState(options.pageIndex);
  if (options.pageIndex != null && options.pageIndex !== prevControlledPageIndex) {
    setPrevControlledPageIndex(options.pageIndex);
    if (paginationState.pageIndex !== options.pageIndex) {
      setPaginationState((previousState) => ({
        ...previousState,
        pageIndex: options.pageIndex
      }));
    }
  }

  const resetPageIndex = useCallback(() => {
    setPaginationState((previousState) => ({
      ...previousState,
      pageIndex: initialPaginationState.pageIndex
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    options?.onPageIndexChange?.(paginationState.pageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationState.pageIndex]);

  return {
    paginationProps: {
      ...paginationProps,
      autoResetPageIndex: options?.autoResetPageIndex !== false && options?.serverSide !== true,
      manualPagination: options?.serverSide,
      onPaginationChange: setPaginationState,
      state: {
        pagination: paginationState
      },
      rowCount: options?.totalItems
    },
    paginationState,
    resetPageIndex,
    setPaginationState
  };
}
