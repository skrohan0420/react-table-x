import type { Column, ColumnDef } from './types.js';

export const defaultColumnSize = 150;
export const defaultColumnMinSize = 40;
export const defaultColumnMaxSize = Number.MAX_SAFE_INTEGER;

export function createColumns<TData>(
  columnDefs: readonly ColumnDef<TData, any>[]
): Column<TData>[] {
  const seen = new Set<string>();

  return columnDefs.map((columnDef, index) => {
    const id = resolveColumnId(columnDef, index);

    if (seen.has(id)) {
      throw new Error(`dx-data-table: duplicate column id "${id}".`);
    }

    seen.add(id);

    return {
      id,
      columnDef,
      getValue: createColumnAccessor(columnDef),
      getDefaultSize: () => columnDef.size ?? defaultColumnSize,
      getMinSize: () => columnDef.minSize ?? defaultColumnMinSize,
      getMaxSize: () => columnDef.maxSize ?? defaultColumnMaxSize,
      getCanGlobalFilter: () => columnDef.enableGlobalFilter !== false,
      getCanHide: () => columnDef.enableHiding !== false,
      getCanSort: () => columnDef.enableSorting !== false
    };
  });
}

function resolveColumnId<TData>(
  columnDef: ColumnDef<TData, any>,
  index: number
): string {
  return columnDef.id ?? columnDef.accessorKey ?? `column_${index}`;
}

function createColumnAccessor<TData, TValue>(
  columnDef: ColumnDef<TData, TValue>
) {
  if (columnDef.accessorFn) {
    return columnDef.accessorFn;
  }

  if (columnDef.accessorKey) {
    return (row: TData) => row[columnDef.accessorKey as keyof TData] as TValue;
  }

  return () => undefined as TValue;
}
