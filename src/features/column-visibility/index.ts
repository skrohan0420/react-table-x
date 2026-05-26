import type { Column, TableFeature } from '../../core/types.js';

export const columnVisibilityFeature: TableFeature<unknown> = {
  name: 'columnVisibility',
  getInitialState: (state) => ({
    ...state,
    columnVisibility: state.columnVisibility
  })
};

export function createVisibleColumns<TData>(
  columns: readonly Column<TData>[],
  columnVisibility: Record<string, boolean>
): Column<TData>[] {
  return columns.filter(
    (column) => !column.getCanHide() || columnVisibility[column.id] !== false
  );
}
