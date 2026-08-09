import type { OnChangeFn, Row, RowData, Updater } from '@tanstack/react-table';

export interface HoveringOptions {
  onHoveringChange?: OnChangeFn<HoveringState | undefined>;
}

export type HoveringState = Record<string, boolean>;

export interface HoveringTableState {
  hovering?: HoveringState;
}

export interface HoverTableAPI<TData> {
  getHoveredRows(): Row<TData>[];
  setHoveredRows(updater: Updater<HoveringState | undefined>): void;
}

export interface HoverRowAPI {
  getIsHovered(): boolean;
}

// Use declaration merging to add our new feature APIs and state types to TanStack Table's existing types.
declare module '@tanstack/react-table' {
  //merge our new feature's state with the existing table state
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface TableState extends HoveringTableState {}
  //merge our new feature's options with the existing table options
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface TableOptionsResolved<TData extends RowData> extends HoveringOptions {}
  //merge our new feature's instance APIs with the existing table instance APIs
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Table<TData extends RowData> extends HoverTableAPI<TData> {}
  // if you need to add cell instance APIs...
  // interface Cell<TData extends RowData, TValue> extends DensityCell
  // if you need to add row instance APIs...
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Row<TData extends RowData> extends HoverRowAPI {}
  // if you need to add column instance APIs...
  // interface Column<TData extends RowData, TValue> extends DensityColumn
  // if you need to add header instance APIs...
  // interface Header<TData extends RowData, TValue> extends DensityHeader

  // Note: declaration merging on `ColumnDef` is not possible because it is a type, not an interface.
  // But you can still use declaration merging on `ColumnDef.meta`
}
