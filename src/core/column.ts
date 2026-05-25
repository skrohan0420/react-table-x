import type { Column, ColumnDef } from './types.js';

export function createColumns<TData>(
  columnDefs: readonly ColumnDef<TData, any>[]
): Column<TData>[] {
  const seen = new Set<string>();

  return columnDefs.map((columnDef, index) => {
    const id = resolveColumnId(columnDef, index);

    if (seen.has(id)) {
      throw new Error(`react-smart-tablex: duplicate column id "${id}".`);
    }

    seen.add(id);

    return {
      id,
      columnDef,
      getValue: createColumnAccessor(columnDef)
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
