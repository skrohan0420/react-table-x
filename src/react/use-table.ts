import { useRef, useSyncExternalStore } from 'react';
import { createTable } from '../core/table.js';
import type { TableInstance, TableOptions } from '../core/types.js';

export function useTable<TData>(options: TableOptions<TData>): TableInstance<TData> {
  const tableRef = useRef<TableInstance<TData>>();

  if (!tableRef.current) {
    tableRef.current = createTable(options);
  }

  tableRef.current.setOptions(options);

  useSyncExternalStore(
    tableRef.current.subscribe,
    tableRef.current.getState,
    tableRef.current.getState
  );

  return tableRef.current;
}

/**
 * @deprecated Use `useTable` instead.
 */
export { useTable as useTableX };
