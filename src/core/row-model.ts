import type { Cell, Column, Row, RowId, RowModel } from './types.js';

export function createCoreRowModel<TData>(
  data: readonly TData[],
  columns: readonly Column<TData>[],
  getVisibleColumns: () => readonly Column<TData>[],
  getRowId: (row: TData, index: number) => RowId,
  getSubRows: ((row: TData, index: number) => readonly TData[] | undefined) | undefined,
  getIsRowExpanded: (rowId: RowId) => boolean,
  toggleRowExpanded: (rowId: RowId, expanded?: boolean) => void
): RowModel<TData> {
  const columnsById = new Map(columns.map((column) => [column.id, column]));
  const rowsById = new Map<RowId, Row<TData>>();
  const flatRows: Row<TData>[] = [];
  const createRow = (
    original: TData,
    index: number,
    depth: number,
    parentId?: RowId
  ): Row<TData> => {
    const valueCache = new Map<string, unknown>();
    const cellCache = new WeakMap<readonly Column<TData>[], Cell<TData>[]>();
    const rowId = getRowId(original, index);

    const getCells = (nextColumns: readonly Column<TData>[]) => {
      const cachedCells = cellCache.get(nextColumns);

      if (cachedCells) {
        return cachedCells;
      }

      const cells = createCells(row, nextColumns);
      cellCache.set(nextColumns, cells);
      return cells;
    };

    const childData = getSubRows?.(original, index) ?? [];
    const row: Row<TData> = {
      id: rowId,
      index,
      original,
      depth,
      ...(parentId === undefined ? {} : { parentId }),
      subRows: [],
      getValue: (columnId) => {
        if (valueCache.has(columnId)) {
          return valueCache.get(columnId) as never;
        }

        const column = columnsById.get(columnId);
        const value = column?.getValue(original, index);
        valueCache.set(columnId, value);
        return value as never;
      },
      getAllCells: () => getCells(columns),
      getVisibleCells: () => getCells(getVisibleColumns()),
      getCanExpand: () => row.subRows.length > 0,
      getIsExpanded: () => getIsRowExpanded(row.id),
      toggleExpanded: (expanded) => toggleRowExpanded(row.id, expanded)
    };

    rowsById.set(row.id, row);
    flatRows.push(row);
    row.subRows = childData.map((child, childIndex) =>
      createRow(child, childIndex, depth + 1, row.id)
    );
    return row;
  };
  const rows = data.map((original, index) => createRow(original, index, 0));

  return {
    rows,
    flatRows,
    rowsById
  };
}

export function createRowModelFromRows<TData>(
  rows: Row<TData>[],
  rowsById?: Map<RowId, Row<TData>>
): RowModel<TData> {
  return {
    rows,
    flatRows: flattenRows(rows),
    rowsById: rowsById ?? new Map(rows.map((row) => [row.id, row]))
  };
}

export function flattenRows<TData>(rows: readonly Row<TData>[]): Row<TData>[] {
  const flatRows: Row<TData>[] = [];

  const visit = (row: Row<TData>) => {
    flatRows.push(row);
    row.subRows.forEach(visit);
  };

  rows.forEach(visit);
  return flatRows;
}

export function createCells<TData>(
  row: Row<TData>,
  columns: readonly Column<TData>[]
): Cell<TData>[] {
  return columns.map((column) => ({
    id: `${row.id}_${column.id}`,
    row,
    column,
    getValue: () => row.getValue(column.id),
    renderValue: () => row.getValue(column.id)
  }));
}
