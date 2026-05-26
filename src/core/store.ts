import type { TableState, Updater } from './types.js';

export const defaultTableState: TableState = {
  columnVisibility: {},
  sorting: [],
  pagination: {
    pageIndex: 0,
    pageSize: 10
  },
  rowSelection: {},
  columnFilters: [],
  columnSizing: {},
  columnOrder: [],
  columnPinning: {},
  expanded: {},
  globalFilter: undefined,
  grouping: []
};

export function resolveUpdater<TValue>(updater: Updater<TValue>, previous: TValue): TValue {
  return typeof updater === 'function'
    ? (updater as (previous: TValue) => TValue)(previous)
    : updater;
}

export function mergeTableState(
  base: TableState,
  partial?: Partial<TableState>
): TableState {
  return {
    ...base,
    ...partial,
    columnVisibility: partial?.columnVisibility ?? base.columnVisibility,
    sorting: partial?.sorting ?? base.sorting,
    pagination: {
      ...base.pagination,
      ...partial?.pagination
    },
    rowSelection: partial?.rowSelection ?? base.rowSelection,
    columnFilters: partial?.columnFilters ?? base.columnFilters,
    columnSizing: partial?.columnSizing ?? base.columnSizing,
    columnOrder: partial?.columnOrder ?? base.columnOrder,
    columnPinning: partial?.columnPinning ?? base.columnPinning,
    expanded: partial?.expanded ?? base.expanded,
    globalFilter:
      partial && 'globalFilter' in partial ? partial.globalFilter : base.globalFilter,
    grouping: partial?.grouping ?? base.grouping
  };
}

export interface TableStore {
  getState: () => TableState;
  setState: (updater: Updater<TableState>) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createTableStore(initialState?: Partial<TableState>): TableStore {
  let state = mergeTableState(defaultTableState, initialState);
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (updater) => {
      const nextState = resolveUpdater(updater, state);

      if (Object.is(nextState, state)) {
        return;
      }

      state = mergeTableState(defaultTableState, nextState);
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
