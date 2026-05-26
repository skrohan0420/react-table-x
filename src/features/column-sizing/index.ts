import type { Column, ColumnSizingState, TableFeature } from '../../core/types.js';

export const columnSizingFeature: TableFeature<unknown> = {
  name: 'columnSizing',
  getInitialState: (state) => ({
    ...state,
    columnSizing: state.columnSizing
  })
};

export function clampColumnSize<TData>(
  column: Column<TData>,
  size: number
): number {
  return Math.min(column.getMaxSize(), Math.max(column.getMinSize(), size));
}

export function getColumnSize<TData>(
  column: Column<TData> | undefined,
  columnSizing: ColumnSizingState
): number {
  if (!column) {
    return 0;
  }

  return clampColumnSize(column, columnSizing[column.id] ?? column.getDefaultSize());
}
