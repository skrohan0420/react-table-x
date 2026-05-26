import { createRowModelFromRows } from '../../core/row-model.js';
import type { Column, ColumnFiltersState, Row, RowModel } from '../../core/types.js';

export function createFilteredRowModel<TData>(
  rowModel: RowModel<TData>,
  columns: readonly Column<TData>[],
  columnFilters: ColumnFiltersState,
  globalFilter: unknown,
  globalFilterFn:
    | ((
        row: Row<TData>,
        columnIds: readonly string[],
        filterValue: unknown
      ) => boolean)
    | undefined
): RowModel<TData> {
  const activeFilters = columnFilters.filter(
    (filter) => filter.value !== undefined && filter.value !== null && filter.value !== ''
  );
  const hasGlobalFilter =
    globalFilter !== undefined && globalFilter !== null && globalFilter !== '';

  if (activeFilters.length === 0 && !hasGlobalFilter) {
    return rowModel;
  }

  const columnsById = new Map(columns.map((column) => [column.id, column]));
  const globalColumnIds = columns
    .filter((column) => column.getCanGlobalFilter())
    .map((column) => column.id);
  const rows = rowModel.rows.filter((row) =>
    matchesColumnFilters(row, activeFilters, columnsById) &&
    matchesGlobalFilter(row, globalColumnIds, globalFilter, globalFilterFn)
  );

  return createRowModelFromRows(rows, rowModel.rowsById);
}

function matchesColumnFilters<TData>(
  row: Row<TData>,
  activeFilters: ColumnFiltersState,
  columnsById: Map<string, Column<TData>>
): boolean {
  return activeFilters.every((filter) => {
    const column = columnsById.get(filter.id);
    const filterFn = column?.columnDef.filterFn;

    if (filterFn) {
      return filterFn(row, filter.id, filter.value);
    }

    const value = row.getValue(filter.id);
    return includesString(value, filter.value);
  });
}

function matchesGlobalFilter<TData>(
  row: Row<TData>,
  columnIds: readonly string[],
  globalFilter: unknown,
  globalFilterFn:
    | ((
        row: Row<TData>,
        columnIds: readonly string[],
        filterValue: unknown
      ) => boolean)
    | undefined
): boolean {
  if (globalFilter === undefined || globalFilter === null || globalFilter === '') {
    return true;
  }

  if (globalFilterFn) {
    return globalFilterFn(row, columnIds, globalFilter);
  }

  return columnIds.some((columnId) => includesString(row.getValue(columnId), globalFilter));
}

function includesString(value: unknown, filterValue: unknown): boolean {
  return String(value ?? '')
    .toLowerCase()
    .includes(String(filterValue).toLowerCase());
}
