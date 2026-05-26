export type RowId = string;

export type Updater<TValue> = TValue | ((previous: TValue) => TValue);
export type SortingState = { id: string; desc: boolean }[];
export type PaginationState = { pageIndex: number; pageSize: number };
export type RowSelectionState = Record<RowId, boolean>;
export type ColumnFiltersState = { id: string; value: unknown }[];
export type ColumnSizingState = Record<string, number>;
export type ColumnOrderState = string[];
export type ColumnPinningState = {
  left?: string[];
  right?: string[];
};
export type ExpandedState = Record<RowId, boolean>;
export type GroupingState = string[];
export type TableStateKey = keyof TableState;
export type DebugOptions =
  | boolean
  | {
      state?: boolean;
      rowModels?: boolean;
      warnings?: boolean;
    };

export type AccessorFn<TData, TValue> = (
  row: TData,
  index: number
) => TValue;

export type CellRenderer<TData, TValue> = (ctx: CellContext<TData, TValue>) => unknown;
export type HeaderRenderer<TData, TValue> = (ctx: HeaderContext<TData, TValue>) => unknown;

export interface ColumnDef<TData, TValue = unknown> {
  id?: string;
  accessorKey?: keyof TData & string;
  accessorFn?: AccessorFn<TData, TValue>;
  header?: string | HeaderRenderer<TData, TValue>;
  cell?: CellRenderer<TData, TValue>;
  filterFn?: (row: Row<TData>, columnId: string, filterValue: unknown) => boolean;
  sortingFn?: (rowA: Row<TData>, rowB: Row<TData>, columnId: string) => number;
  enableGlobalFilter?: boolean;
  enableHiding?: boolean;
  enableSorting?: boolean;
  size?: number;
  minSize?: number;
  maxSize?: number;
  meta?: Record<string, unknown>;
}

export interface Column<TData, TValue = unknown> {
  id: string;
  columnDef: ColumnDef<TData, TValue>;
  getValue: AccessorFn<TData, TValue>;
  getDefaultSize: () => number;
  getMinSize: () => number;
  getMaxSize: () => number;
  getCanGlobalFilter: () => boolean;
  getCanHide: () => boolean;
  getCanSort: () => boolean;
}

export interface Row<TData> {
  id: RowId;
  index: number;
  original: TData;
  depth: number;
  parentId?: RowId;
  subRows: Row<TData>[];
  getValue: <TValue = unknown>(columnId: string) => TValue;
  getAllCells: () => Cell<TData>[];
  getVisibleCells: () => Cell<TData>[];
  getCanExpand: () => boolean;
  getIsExpanded: () => boolean;
  toggleExpanded: (expanded?: boolean) => void;
}

export interface Cell<TData, TValue = unknown> {
  id: string;
  row: Row<TData>;
  column: Column<TData, TValue>;
  getValue: () => TValue;
  renderValue: () => TValue;
}

export interface Header<TData, TValue = unknown> {
  id: string;
  column: Column<TData, TValue>;
}

export interface HeaderGroup<TData> {
  id: string;
  headers: Header<TData>[];
}

export interface RowModel<TData> {
  rows: Row<TData>[];
  flatRows: Row<TData>[];
  rowsById: Map<RowId, Row<TData>>;
}

export interface TableState {
  columnVisibility: Record<string, boolean>;
  sorting: SortingState;
  pagination: PaginationState;
  rowSelection: RowSelectionState;
  columnFilters: ColumnFiltersState;
  columnSizing: ColumnSizingState;
  columnOrder: ColumnOrderState;
  columnPinning: ColumnPinningState;
  expanded: ExpandedState;
  globalFilter: unknown;
  grouping: GroupingState;
}

export interface TableOptions<TData> {
  data: readonly TData[];
  columns: readonly ColumnDef<TData, any>[];
  state?: Partial<TableState>;
  initialState?: Partial<TableState>;
  onStateChange?: (updater: Updater<TableState>) => void;
  onSortingChange?: (updater: Updater<SortingState>) => void;
  onPaginationChange?: (updater: Updater<PaginationState>) => void;
  onRowSelectionChange?: (updater: Updater<RowSelectionState>) => void;
  onColumnFiltersChange?: (updater: Updater<ColumnFiltersState>) => void;
  onColumnSizingChange?: (updater: Updater<ColumnSizingState>) => void;
  onColumnOrderChange?: (updater: Updater<ColumnOrderState>) => void;
  onColumnPinningChange?: (updater: Updater<ColumnPinningState>) => void;
  onExpandedChange?: (updater: Updater<ExpandedState>) => void;
  onGlobalFilterChange?: (updater: Updater<unknown>) => void;
  onGroupingChange?: (updater: Updater<GroupingState>) => void;
  getRowId?: (row: TData, index: number) => RowId;
  getSubRows?: (row: TData, index: number) => readonly TData[] | undefined;
  globalFilterFn?: (
    row: Row<TData>,
    columnIds: readonly string[],
    filterValue: unknown
  ) => boolean;
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  manualExpanding?: boolean;
  features?: readonly TableFeature<TData>[];
  debug?: DebugOptions;
}

export interface ResolvedTableOptions<TData> extends TableOptions<TData> {
  state?: Partial<TableState>;
}

export interface CellContext<TData, TValue> {
  table: TableInstance<TData>;
  row: Row<TData>;
  column: Column<TData, TValue>;
  cell: Cell<TData, TValue>;
  getValue: () => TValue;
}

export interface HeaderContext<TData, TValue> {
  table: TableInstance<TData>;
  column: Column<TData, TValue>;
  header: Header<TData, TValue>;
}

export interface TableFeature<TData> {
  name: string;
  getDefaultOptions?: (options: TableOptions<TData>) => Partial<TableOptions<TData>>;
  getInitialState?: (state: TableState) => TableState;
  createTable?: (table: TableInstance<TData>) => void;
}

export interface TableFeatureContext<TData> {
  table: TableInstance<TData>;
}

export interface TableInstance<TData> {
  getOptions: () => ResolvedTableOptions<TData>;
  setOptions: (options: TableOptions<TData>) => void;
  getState: () => TableState;
  setState: (updater: Updater<TableState>) => void;
  subscribe: (listener: () => void) => () => void;
  getAllColumns: () => Column<TData>[];
  getColumn: (columnId: string) => Column<TData> | undefined;
  getVisibleColumns: () => Column<TData>[];
  getLeftVisibleColumns: () => Column<TData>[];
  getCenterVisibleColumns: () => Column<TData>[];
  getRightVisibleColumns: () => Column<TData>[];
  getVisibleCells: (row: Row<TData>) => Cell<TData>[];
  getHeaderGroups: () => HeaderGroup<TData>[];
  getRow: (rowId: RowId) => Row<TData> | undefined;
  getCoreRowModel: () => RowModel<TData>;
  getFilteredRowModel: () => RowModel<TData>;
  getSortedRowModel: () => RowModel<TData>;
  getExpandedRowModel: () => RowModel<TData>;
  getPaginationRowModel: () => RowModel<TData>;
  getRowModel: () => RowModel<TData>;
  setSorting: (updater: Updater<SortingState>) => void;
  setPagination: (updater: Updater<PaginationState>) => void;
  setColumnFilters: (updater: Updater<ColumnFiltersState>) => void;
  setGlobalFilter: (updater: Updater<unknown>) => void;
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  toggleAllPageRowsSelected: (selected?: boolean) => void;
  toggleAllFilteredRowsSelected: (selected?: boolean) => void;
  getIsAllPageRowsSelected: () => boolean;
  getIsSomePageRowsSelected: () => boolean;
  setColumnSizing: (updater: Updater<ColumnSizingState>) => void;
  setColumnSize: (columnId: string, size: number) => void;
  resetColumnSizing: () => void;
  getColumnSize: (columnId: string) => number;
  setColumnOrder: (updater: Updater<ColumnOrderState>) => void;
  resetColumnOrder: () => void;
  setColumnPinning: (updater: Updater<ColumnPinningState>) => void;
  pinColumn: (columnId: string, position: 'left' | 'right' | false) => void;
  setExpanded: (updater: Updater<ExpandedState>) => void;
  toggleRowExpanded: (rowId: RowId, expanded?: boolean) => void;
  setGrouping: (updater: Updater<GroupingState>) => void;
  toggleRowSelected: (rowId: RowId, selected?: boolean) => void;
  getIsRowSelected: (rowId: RowId) => boolean;
  getSerializableState: (keys?: readonly TableStateKey[]) => Partial<TableState>;
  hydrateState: (updater: Updater<Partial<TableState>>) => void;
  subscribeToState: <TSelected>(
    selector: (state: TableState) => TSelected,
    listener: (selected: TSelected, previous: TSelected) => void,
    isEqual?: (a: TSelected, b: TSelected) => boolean
  ) => () => void;
  getDebugSnapshot: () => TableDebugSnapshot;
  getCellContext: <TValue>(cell: Cell<TData, TValue>) => CellContext<TData, TValue>;
  getHeaderContext: <TValue>(header: Header<TData, TValue>) => HeaderContext<TData, TValue>;
}

export interface TableDebugSnapshot {
  state: TableState;
  rows: {
    core: number;
    filtered: number;
    sorted: number;
    paginated: number;
  };
  columns: {
    all: string[];
    visible: string[];
    pinnedLeft: string[];
    pinnedRight: string[];
  };
  features: string[];
}
