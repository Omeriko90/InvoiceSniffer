import { Updater, functionalUpdate, makeStateUpdater, type Row, type RowData, type Table, type TableFeature } from '@tanstack/react-table';
import type { HoveringOptions, HoveringState, HoveringTableState } from './types';

// Here is all of the actual javascript code for our new feature
export const HoverFeature: TableFeature<RowData> = {
  getInitialState(state): HoveringTableState {
    return {
      hovering: undefined,
      ...state
    };
  },

  getDefaultOptions<TData extends RowData>(table: Table<TData>): HoveringOptions {
    return {
      onHoveringChange: makeStateUpdater('hovering', table)
    };
  },

  createTable<TData extends RowData>(table: Table<TData>) {
    table.getHoveredRows = () =>
      Object.entries(table.getState().hovering || {})
        .filter(([, isHovered]) => isHovered)
        .map(([id]) => table.getRow(id));

    table.setHoveredRows = (updater) => {
      const safeUpdater: Updater<HoveringState | undefined> = (old) => functionalUpdate(updater, old);
      return table.options.onHoveringChange?.(safeUpdater);
    };
  },

  createRow<TData extends RowData>(row: Row<TData>, table: Table<TData>) {
    row.getIsHovered = () => Boolean(table.getState().hovering?.[row.id]);
  }
};
