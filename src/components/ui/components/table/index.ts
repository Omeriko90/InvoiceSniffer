// Trimmed re-export surface for the ported Table system. The original
// `table/index.ts` also re-exported the deprecated MUI-based `Table`/`TableBody`/
// `TableFooter`/`TableHead` and the `expanding`/`useControlledRowSelection` helpers,
// none of which are part of this port (see docs/component-port-guide.md §4 rule 4).
export { createColumnHelper, type PaginationState, type Row } from '@tanstack/react-table';
export * from './TableBaseComponents';
export * from './TableHeader';
export * from './TableBody';
export * from './TableEmptyState';
export * from './Table';
export * from './pagination/useControlledPagination';
export * from './pagination/usePagination';
export * from './sorting/useControlledSorting';
export * from './sorting/useSorting';
export * from './sorting/sortingUtils';
export * from './useTable';
export * from './selection/useRowSelection';
export * from './selection/selectionColumn';
export * from './columns';
