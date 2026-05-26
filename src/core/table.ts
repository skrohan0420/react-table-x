import { createColumns } from './column.js';
import { resolveTableFeatures } from './features.js';
import { memo } from './memo.js';
import { createCoreRowModel } from './row-model.js';
import { createOrderedColumns } from '../features/column-ordering/index.js';
import { createPinnedColumns } from '../features/column-pinning/index.js';
import { getColumnSize as getResolvedColumnSize } from '../features/column-sizing/index.js';
import { createVisibleColumns } from '../features/column-visibility/index.js';
import {
  createExpandedRowModel,
  getNextExpandedState
} from '../features/expanding/index.js';
import { createFilteredRowModel } from '../features/filtering/index.js';
import { createPaginationRowModel } from '../features/pagination/index.js';
import { getNextRowSelectionState } from '../features/row-selection/index.js';
import { createSortedRowModel } from '../features/sorting/index.js';
import {
  createTableStore,
  defaultTableState,
  mergeTableState,
  resolveUpdater
} from './store.js';
import type {
  Cell,
  CellContext,
  ColumnOrderState,
  ColumnPinningState,
  Header,
  HeaderContext,
  HeaderGroup,
  ColumnSizingState,
  ExpandedState,
  GroupingState,
  PaginationState,
  Row,
  RowId,
  RowModel,
  RowSelectionState,
  SortingState,
  TableFeature,
  TableInstance,
  TableOptions,
  TableState,
  TableStateKey
} from './types.js';

const defaultGetRowId = <TData>(_: TData, index: number): RowId => String(index);

export function createTable<TData>(options: TableOptions<TData>): TableInstance<TData> {
  const features = resolveTableFeatures(options.features);
  let resolvedOptions = resolveOptions(options, features);

  const initialStateFromFeatures = features.reduce(
    (state, feature) => feature.getInitialState?.(state) ?? state,
    mergeTableState(defaultTableState, options.initialState)
  );
  const store = createTableStore(initialStateFromFeatures);
  const featureNames = features.map((feature) => feature.name);

  const getMemoizedColumns = memo(createColumns<TData>);
  const getMemoizedOrderedColumns = memo(
    (
      columns: ReturnType<typeof createColumns<TData>>,
      columnOrder: TableState['columnOrder']
    ) => createOrderedColumns(columns, columnOrder)
  );
  const getMemoizedVisibleColumns = memo(
    (
      columns: ReturnType<typeof createColumns<TData>>,
      columnVisibility: TableState['columnVisibility']
    ) => createVisibleColumns(columns, columnVisibility)
  );
  const getMemoizedPinnedColumns = memo(
    (
      columns: ReturnType<typeof createColumns<TData>>,
      columnPinning: TableState['columnPinning']
    ) => createPinnedColumns(columns, columnPinning)
  );
  const getMemoizedColumnsById = memo((columns: ReturnType<typeof createColumns<TData>>) =>
    new Map(columns.map((column) => [column.id, column]))
  );
  const getMemoizedState = memo(
    (baseState: TableState, controlledState: Partial<TableState> | undefined) =>
      controlledState ? mergeTableState(baseState, controlledState) : baseState
  );
  const getMemoizedHeaderGroups = memo(
    (columns: ReturnType<typeof createColumns<TData>>): HeaderGroup<TData>[] => [
      {
        id: 'header',
        headers: columns.map((column): Header<TData> => ({
          id: column.id,
          column
        }))
      }
    ]
  );
  let table: TableInstance<TData>;
  const getCurrentVisibleColumns = () => table.getVisibleColumns();
  const getIsRowExpanded = (rowId: RowId) => table.getState().expanded[rowId] === true;
  const toggleExpandedForRow = (rowId: RowId, expanded?: boolean) =>
    table.toggleRowExpanded(rowId, expanded);
  const getMemoizedCoreRowModel = memo(
    (
      data: readonly TData[],
      columns: ReturnType<typeof createColumns<TData>>,
      getRowId: (row: TData, index: number) => RowId,
      getSubRows: TableOptions<TData>['getSubRows']
    ) =>
      createCoreRowModel(
        data,
        columns,
        getCurrentVisibleColumns,
        getRowId,
        getSubRows,
        getIsRowExpanded,
        toggleExpandedForRow
      )
  );
  const visibleCellCache = new WeakMap<
    Row<TData>,
    WeakMap<ReturnType<typeof createColumns<TData>>, Cell<TData>[]>
  >();
  const getVisibleCellsForRow = (
    row: Row<TData>,
    visibleColumns: ReturnType<typeof createColumns<TData>>
  ) => {
    let rowCache = visibleCellCache.get(row);

    if (!rowCache) {
      rowCache = new WeakMap();
      visibleCellCache.set(row, rowCache);
    }

    const cachedCells = rowCache.get(visibleColumns);

    if (cachedCells) {
      return cachedCells;
    }

    const cellsByColumnId = new Map(
      row.getAllCells().map((cell) => [cell.column.id, cell])
    );
    const cells = visibleColumns.flatMap((column) => {
      const cell = cellsByColumnId.get(column.id);
      return cell ? [cell] : [];
    });

    rowCache.set(visibleColumns, cells);
    return cells;
  };
  const getMemoizedFilteredRowModel = memo(
    (
      rowModel: RowModel<TData>,
      columns: ReturnType<typeof createColumns<TData>>,
      columnFilters: TableState['columnFilters'],
      globalFilter: TableState['globalFilter'],
      globalFilterFn: TableOptions<TData>['globalFilterFn'],
      manualFiltering: boolean | undefined
    ) =>
      manualFiltering
        ? rowModel
        : createFilteredRowModel(
            rowModel,
            columns,
            columnFilters,
            globalFilter,
            globalFilterFn
          )
  );
  const getMemoizedSortedRowModel = memo(
    (
      rowModel: RowModel<TData>,
      columns: ReturnType<typeof createColumns<TData>>,
      sorting: TableState['sorting'],
      manualSorting: boolean | undefined
    ) =>
      manualSorting
        ? rowModel
        : createSortedRowModel(rowModel, columns, sorting)
  );
  const getMemoizedPaginationRowModel = memo(
    (
      rowModel: RowModel<TData>,
      pagination: TableState['pagination'],
      manualPagination: boolean | undefined
    ) =>
      manualPagination ? rowModel : createPaginationRowModel(rowModel, pagination)
  );
  const getMemoizedExpandedRowModel = memo(
    (
      rowModel: RowModel<TData>,
      expanded: TableState['expanded'],
      manualExpanding: boolean | undefined
    ) => (manualExpanding ? rowModel : createExpandedRowModel(rowModel, expanded))
  );

  const updateState = (updater: (previous: TableState) => TableState) => {
    const previousState = table.getState();
    const nextState = mergeTableState(defaultTableState, updater(previousState));

    if (isTableStateEqual(previousState, nextState)) {
      return;
    }

    debugLog(resolvedOptions, 'state', 'state updated', nextState);
    resolvedOptions.onStateChange?.(nextState);
    store.setState(nextState);
  };

  table = {
    getOptions: () => resolvedOptions,
    setOptions: (nextOptions) => {
      resolvedOptions = resolveOptions(nextOptions, features);
    },
    getState: () => getMemoizedState([store.getState(), resolvedOptions.state]),
    setState: (updater) => {
      updateState((previousState) => resolveUpdater(updater, previousState));
    },
    subscribe: store.subscribe,
    getAllColumns: () => {
      const state = table.getState();
      return getMemoizedOrderedColumns([
        getMemoizedColumns([resolvedOptions.columns]),
        state.columnOrder
      ]);
    },
    getColumn: (columnId) =>
      getMemoizedColumnsById([getMemoizedColumns([resolvedOptions.columns])]).get(
        columnId
      ),
    getColumnSize: (columnId) => {
      const column = table.getColumn(columnId);
      return getResolvedColumnSize(column, table.getState().columnSizing);
    },
    getVisibleColumns: () => {
      const state = table.getState();
      const visibleColumns = getMemoizedVisibleColumns([
        table.getAllColumns(),
        state.columnVisibility
      ]);
      const pinned = getMemoizedPinnedColumns([visibleColumns, state.columnPinning]);

      return [...pinned.left, ...pinned.center, ...pinned.right];
    },
    getLeftVisibleColumns: () => {
      const state = table.getState();
      return getMemoizedPinnedColumns([
        getMemoizedVisibleColumns([table.getAllColumns(), state.columnVisibility]),
        state.columnPinning
      ]).left;
    },
    getCenterVisibleColumns: () => {
      const state = table.getState();
      return getMemoizedPinnedColumns([
        getMemoizedVisibleColumns([table.getAllColumns(), state.columnVisibility]),
        state.columnPinning
      ]).center;
    },
    getRightVisibleColumns: () => {
      const state = table.getState();
      return getMemoizedPinnedColumns([
        getMemoizedVisibleColumns([table.getAllColumns(), state.columnVisibility]),
        state.columnPinning
      ]).right;
    },
    getVisibleCells: (row) => getVisibleCellsForRow(row, table.getVisibleColumns()),
    getHeaderGroups: () => getMemoizedHeaderGroups([table.getVisibleColumns()]),
    getRow: (rowId) => table.getCoreRowModel().rowsById.get(rowId),
    getCoreRowModel: (): RowModel<TData> => {
      const getRowId = resolvedOptions.getRowId ?? defaultGetRowId;

      return getMemoizedCoreRowModel([
        resolvedOptions.data,
        getMemoizedColumns([resolvedOptions.columns]),
        getRowId,
        resolvedOptions.getSubRows
      ]);
    },
    getFilteredRowModel: () =>
      getMemoizedFilteredRowModel([
        table.getCoreRowModel(),
        table.getAllColumns(),
        table.getState().columnFilters,
        table.getState().globalFilter,
        resolvedOptions.globalFilterFn,
        resolvedOptions.manualFiltering
      ]),
    getSortedRowModel: () =>
      getMemoizedSortedRowModel([
        table.getFilteredRowModel(),
        table.getAllColumns(),
        table.getState().sorting,
        resolvedOptions.manualSorting
      ]),
    getExpandedRowModel: () =>
      getMemoizedExpandedRowModel([
        table.getSortedRowModel(),
        table.getState().expanded,
        resolvedOptions.manualExpanding
      ]),
    getPaginationRowModel: () =>
      getMemoizedPaginationRowModel([
        table.getExpandedRowModel(),
        table.getState().pagination,
        resolvedOptions.manualPagination
      ]),
    getRowModel: () => table.getPaginationRowModel(),
    setSorting: (updater) => {
      resolvedOptions.onSortingChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        sorting: resolveUpdater<SortingState>(updater, previousState.sorting)
      }));
    },
    setPagination: (updater) => {
      resolvedOptions.onPaginationChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        pagination: resolveUpdater<PaginationState>(
          updater,
          previousState.pagination
        )
      }));
    },
    setColumnFilters: (updater) => {
      resolvedOptions.onColumnFiltersChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        columnFilters: resolveUpdater(updater, previousState.columnFilters)
      }));
    },
    setGlobalFilter: (updater) => {
      resolvedOptions.onGlobalFilterChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        globalFilter: resolveUpdater(updater, previousState.globalFilter)
      }));
    },
    setRowSelection: (updater) => {
      resolvedOptions.onRowSelectionChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        rowSelection: resolveUpdater<RowSelectionState>(
          updater,
          previousState.rowSelection
        )
      }));
    },
    toggleAllPageRowsSelected: (selected) => {
      const rows = table.getRowModel().rows;
      const nextSelected =
        selected ?? !rows.every((row) => table.getIsRowSelected(row.id));

      table.setRowSelection((previousState) => {
        const nextState = { ...previousState };

        rows.forEach((row) => {
          if (nextSelected) {
            nextState[row.id] = true;
          } else {
            delete nextState[row.id];
          }
        });

        return nextState;
      });
    },
    toggleAllFilteredRowsSelected: (selected) => {
      const rows = table.getFilteredRowModel().flatRows;
      const nextSelected =
        selected ?? !rows.every((row) => table.getIsRowSelected(row.id));

      table.setRowSelection((previousState) => {
        const nextState = { ...previousState };

        rows.forEach((row) => {
          if (nextSelected) {
            nextState[row.id] = true;
          } else {
            delete nextState[row.id];
          }
        });

        return nextState;
      });
    },
    getIsAllPageRowsSelected: () => {
      const rows = table.getRowModel().rows;
      return rows.length > 0 && rows.every((row) => table.getIsRowSelected(row.id));
    },
    getIsSomePageRowsSelected: () => {
      const rows = table.getRowModel().rows;
      return rows.some((row) => table.getIsRowSelected(row.id));
    },
    setColumnSizing: (updater) => {
      resolvedOptions.onColumnSizingChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        columnSizing: resolveUpdater<ColumnSizingState>(
          updater,
          previousState.columnSizing
        )
      }));
    },
    setColumnSize: (columnId, size) => {
      table.setColumnSizing((previousState) => {
        const column = getMemoizedColumnsById([table.getAllColumns()]).get(columnId);

        if (!column) {
          warn(resolvedOptions, `Unknown column id "${columnId}" passed to setColumnSize.`);
          return previousState;
        }

        const nextSize = getResolvedColumnSize(column, { [columnId]: size });

        if (previousState[columnId] === nextSize) {
          return previousState;
        }

        return {
          ...previousState,
          [columnId]: nextSize
        };
      });
    },
    resetColumnSizing: () => {
      table.setColumnSizing({});
    },
    setColumnOrder: (updater) => {
      resolvedOptions.onColumnOrderChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        columnOrder: resolveUpdater<ColumnOrderState>(
          updater,
          previousState.columnOrder
        )
      }));
    },
    resetColumnOrder: () => {
      table.setColumnOrder([]);
    },
    setColumnPinning: (updater) => {
      resolvedOptions.onColumnPinningChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        columnPinning: resolveUpdater<ColumnPinningState>(
          updater,
          previousState.columnPinning
        )
      }));
    },
    pinColumn: (columnId, position) => {
      table.setColumnPinning((previousState) => {
        const left = (previousState.left ?? []).filter((id) => id !== columnId);
        const right = (previousState.right ?? []).filter((id) => id !== columnId);

        if (position === 'left') {
          left.push(columnId);
        }

        if (position === 'right') {
          right.push(columnId);
        }

        return {
          left,
          right
        };
      });
    },
    setExpanded: (updater) => {
      resolvedOptions.onExpandedChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        expanded: resolveUpdater<ExpandedState>(updater, previousState.expanded)
      }));
    },
    toggleRowExpanded: (rowId, expanded) => {
      table.setExpanded((previousState) =>
        getNextExpandedState(previousState, rowId, expanded)
      );
    },
    setGrouping: (updater) => {
      resolvedOptions.onGroupingChange?.(updater);
      updateState((previousState) => ({
        ...previousState,
        grouping: resolveUpdater<GroupingState>(updater, previousState.grouping)
      }));
    },
    toggleRowSelected: (rowId, selected) => {
      table.setRowSelection((previousState) =>
        getNextRowSelectionState(previousState, rowId, selected)
      );
    },
    getIsRowSelected: (rowId) => table.getState().rowSelection[rowId] === true,
    getSerializableState: (keys) => {
      const state = table.getState();
      const stateKeys = keys ?? (Object.keys(state) as TableStateKey[]);

      return stateKeys.reduce<Partial<TableState>>((partialState, key) => {
        partialState[key] = state[key] as never;
        return partialState;
      }, {});
    },
    hydrateState: (updater) => {
      updateState((previousState) =>
        mergeTableState(previousState, resolveUpdater(updater, previousState))
      );
    },
    subscribeToState: (selector, listener, isEqual = Object.is) => {
      let previous = selector(table.getState());

      return table.subscribe(() => {
        const next = selector(table.getState());

        if (isEqual(next, previous)) {
          return;
        }

        const previousSnapshot = previous;
        previous = next;
        listener(next, previousSnapshot);
      });
    },
    getDebugSnapshot: () => ({
      state: table.getState(),
      rows: {
        core: table.getCoreRowModel().rows.length,
        filtered: table.getFilteredRowModel().rows.length,
        sorted: table.getSortedRowModel().rows.length,
        paginated: table.getPaginationRowModel().rows.length
      },
      columns: {
        all: table.getAllColumns().map((column) => column.id),
        visible: table.getVisibleColumns().map((column) => column.id),
        pinnedLeft: table.getLeftVisibleColumns().map((column) => column.id),
        pinnedRight: table.getRightVisibleColumns().map((column) => column.id)
      },
      features: featureNames
    }),
    getCellContext: <TValue>(cell: Cell<TData, TValue>): CellContext<TData, TValue> => ({
      table,
      row: cell.row,
      column: cell.column,
      cell,
      getValue: cell.getValue
    }),
    getHeaderContext: <TValue>(
      header: Header<TData, TValue>
    ): HeaderContext<TData, TValue> => ({
      table,
      column: header.column,
      header
    })
  };

  features.forEach((feature) => feature.createTable?.(table));

  return table;
}

/**
 * @deprecated Use `createTable` instead.
 */
export { createTable as createTableX };

function resolveOptions<TData>(
  options: TableOptions<TData>,
  features: readonly TableFeature<TData>[]
): TableOptions<TData> {
  return features.reduce(
    (resolvedOptions, feature) => ({
      ...feature.getDefaultOptions?.(resolvedOptions),
      ...resolvedOptions
    }),
    options
  );
}

function isTableStateEqual(left: TableState, right: TableState): boolean {
  return (
    left.columnVisibility === right.columnVisibility &&
    left.sorting === right.sorting &&
    left.pagination === right.pagination &&
    left.rowSelection === right.rowSelection &&
    left.columnFilters === right.columnFilters &&
    left.columnSizing === right.columnSizing &&
    left.columnOrder === right.columnOrder &&
    left.columnPinning === right.columnPinning &&
    left.expanded === right.expanded &&
    left.globalFilter === right.globalFilter &&
    left.grouping === right.grouping
  );
}

function shouldDebug(
  options: { debug?: TableOptions<unknown>['debug'] },
  scope: 'state' | 'rowModels' | 'warnings'
) {
  return options.debug === true || (typeof options.debug === 'object' && options.debug[scope]);
}

function debugLog(
  options: { debug?: TableOptions<unknown>['debug'] },
  scope: 'state' | 'rowModels',
  message: string,
  payload: unknown
) {
  if (shouldDebug(options, scope)) {
    console.info(`[dx-data-table:${scope}] ${message}`, payload);
  }
}

function warn(options: { debug?: TableOptions<unknown>['debug'] }, message: string) {
  if (
    options.debug === false ||
    (typeof options.debug === 'object' && options.debug.warnings === false)
  ) {
    return;
  }

  console.warn(`[dx-data-table] ${message}`);
}
