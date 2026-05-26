import { createRowModelFromRows } from '../../core/row-model.js';
import type { Column, Row, RowModel, SortingState } from '../../core/types.js';

export function createSortedRowModel<TData>(
  rowModel: RowModel<TData>,
  columns: readonly Column<TData>[],
  sorting: SortingState
): RowModel<TData> {
  if (sorting.length === 0) {
    return rowModel;
  }

  const columnsById = new Map(columns.map((column) => [column.id, column]));
  const rows = rowModel.rows
    .map((row, sortIndex) => ({ row, sortIndex }))
    .sort((rowA, rowB) => {
      for (const sort of sorting) {
        const column = columnsById.get(sort.id);
        const sortingFn = column?.columnDef.sortingFn;
        const direction = sort.desc ? -1 : 1;

        if (!column?.getCanSort()) {
          continue;
        }

        const result = sortingFn
          ? sortingFn(rowA.row, rowB.row, sort.id)
          : compareValues(rowA.row, rowB.row, sort.id);

        if (result !== 0) {
          return result * direction;
        }
      }

      return rowA.sortIndex - rowB.sortIndex;
    })
    .map((item) => item.row);

  return createRowModelFromRows(rows, rowModel.rowsById);
}

function compareValues<TData>(
  rowA: Row<TData>,
  rowB: Row<TData>,
  columnId: string
): number {
  const valueA = rowA.getValue(columnId);
  const valueB = rowB.getValue(columnId);

  if (Object.is(valueA, valueB)) {
    return 0;
  }

  if (valueA == null) {
    return 1;
  }

  if (valueB == null) {
    return -1;
  }

  if (valueA instanceof Date && valueB instanceof Date) {
    return valueA.getTime() - valueB.getTime();
  }

  if (typeof valueA === 'number' && typeof valueB === 'number') {
    return valueA - valueB;
  }

  return String(valueA).localeCompare(String(valueB), undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}
