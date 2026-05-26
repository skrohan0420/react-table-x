import type { Column, ColumnPinningState, TableFeature } from '../../core/types.js';

export interface PinnedColumns<TData> {
  left: Column<TData>[];
  center: Column<TData>[];
  right: Column<TData>[];
}

export const columnPinningFeature: TableFeature<unknown> = {
  name: 'columnPinning',
  getInitialState: (state) => ({
    ...state,
    columnPinning: state.columnPinning
  })
};

export function createPinnedColumns<TData>(
  columns: readonly Column<TData>[],
  columnPinning: ColumnPinningState
): PinnedColumns<TData> {
  const leftIds = new Set(columnPinning.left ?? []);
  const rightIds = new Set(columnPinning.right ?? []);
  const left: Column<TData>[] = [];
  const center: Column<TData>[] = [];
  const right: Column<TData>[] = [];

  columns.forEach((column) => {
    if (leftIds.has(column.id)) {
      left.push(column);
      return;
    }

    if (rightIds.has(column.id)) {
      right.push(column);
      return;
    }

    center.push(column);
  });

  return { left, center, right };
}
