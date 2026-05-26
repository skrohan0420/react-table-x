import type { Column, ColumnOrderState, TableFeature } from '../../core/types.js';

export const columnOrderingFeature: TableFeature<unknown> = {
  name: 'columnOrdering',
  getInitialState: (state) => ({
    ...state,
    columnOrder: state.columnOrder
  })
};

export function createOrderedColumns<TData>(
  columns: readonly Column<TData>[],
  columnOrder: ColumnOrderState
): Column<TData>[] {
  if (columnOrder.length === 0) {
    return columns.slice();
  }

  const columnsById = new Map(columns.map((column) => [column.id, column]));
  const ordered: Column<TData>[] = [];
  const seen = new Set<string>();

  columnOrder.forEach((columnId) => {
    const column = columnsById.get(columnId);

    if (column) {
      ordered.push(column);
      seen.add(column.id);
    }
  });

  columns.forEach((column) => {
    if (!seen.has(column.id)) {
      ordered.push(column);
    }
  });

  return ordered;
}
