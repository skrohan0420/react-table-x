import type { AccessorFn, ColumnDef } from './types.js';

export interface ColumnHelper<TData> {
  accessor<TKey extends keyof TData & string>(
    accessorKey: TKey,
    columnDef?: Omit<ColumnDef<TData, TData[TKey]>, 'accessorKey' | 'accessorFn'>
  ): ColumnDef<TData, TData[TKey]>;
  accessor<TValue>(
    accessorFn: AccessorFn<TData, TValue>,
    columnDef: Omit<ColumnDef<TData, TValue>, 'accessorKey' | 'accessorFn'> & {
      id: string;
    }
  ): ColumnDef<TData, TValue>;
  display(
    columnDef: Omit<ColumnDef<TData, unknown>, 'accessorKey' | 'accessorFn'> & {
      id: string;
    }
  ): ColumnDef<TData, unknown>;
}

export function createColumnHelper<TData>(): ColumnHelper<TData> {
  return {
    accessor: (
      accessor: keyof TData & string | AccessorFn<TData, unknown>,
      columnDef: Omit<ColumnDef<TData>, 'accessorKey' | 'accessorFn'> = {}
    ) => {
      if (typeof accessor === 'function') {
        return {
          ...columnDef,
          accessorFn: accessor
        };
      }

      return {
        ...columnDef,
        accessorKey: accessor
      };
    },
    display: (columnDef) => columnDef
  } as ColumnHelper<TData>;
}
