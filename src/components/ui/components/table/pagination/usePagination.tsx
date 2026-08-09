import type { PaginationState, TableOptions } from '@tanstack/react-table';

export interface UsePaginationOptions {
  autoResetPageIndex?: boolean;
  initialPageIndex?: number;
  initialPageSize?: number;
}

export const DEFAULT_INITIAL_STATE: Readonly<PaginationState> = {
  pageIndex: 0,
  pageSize: 25
};

export function usePagination(options?: UsePaginationOptions): {
  paginationProps: Pick<TableOptions<unknown>, 'autoResetPageIndex' | 'manualPagination'> & {
    initialState: {
      pagination: PaginationState;
    };
  };
} {
  return {
    paginationProps: {
      autoResetPageIndex: options?.autoResetPageIndex,
      initialState: {
        pagination: {
          pageIndex: options?.initialPageIndex ?? DEFAULT_INITIAL_STATE.pageIndex,
          pageSize: options?.initialPageSize ?? DEFAULT_INITIAL_STATE.pageSize
        }
      },
      manualPagination: false
    }
  };
}
