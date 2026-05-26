# Feature Guide

`dx-data-table` keeps features headless. State and row models live in the core;
rendering, gestures, sticky positioning, and drag-and-drop live in user space.

## Implemented Features

### Sorting

- State: `sorting`
- Setter: `table.setSorting(updater)`
- Manual mode: `manualSorting`
- Column hook: `sortingFn`

Sorting is stable and supports multi-column sort state. Columns with
`enableSorting: false` are ignored by the client sorter.

### Column Filtering and Global Filtering

- State: `columnFilters`, `globalFilter`
- Setters: `table.setColumnFilters(updater)`, `table.setGlobalFilter(updater)`
- Manual mode: `manualFiltering`
- Column hook: `filterFn`
- Table hook: `globalFilterFn`

Column filters run before sorting. Global filtering checks all globally
filterable columns unless `globalFilterFn` is provided.

### Pagination

- State: `pagination`
- Setter: `table.setPagination(updater)`
- Manual mode: `manualPagination`

Pagination runs after expansion so page size matches visible rows.

### Row Selection

- State: `rowSelection`
- Setters: `table.setRowSelection(updater)`, `table.toggleRowSelected(rowId)`
- Bulk helpers:
  - `table.toggleAllPageRowsSelected(selected?)`
  - `table.toggleAllFilteredRowsSelected(selected?)`
  - `table.getIsAllPageRowsSelected()`
  - `table.getIsSomePageRowsSelected()`

Selection is keyed by row ID. Applications should provide `getRowId` for stable
selection across sorting, filtering, pagination, and server refreshes.

### Column Visibility

- State: `columnVisibility`
- Non-hideable columns: `enableHiding: false`

Visibility affects visible columns and cells without rebuilding the core row
model.

### Column Sizing

- State: `columnSizing`
- Setters:
  - `table.setColumnSizing(updater)`
  - `table.setColumnSize(columnId, size)`
  - `table.resetColumnSizing()`
- Column defaults: `size`, `minSize`, `maxSize`

Sizing stores numbers only. Pointer gestures and resize handles belong in the
renderer.

### Column Ordering

- State: `columnOrder`
- Setters:
  - `table.setColumnOrder(updater)`
  - `table.resetColumnOrder()`

Missing IDs are appended in definition order, which keeps persisted order state
forward-compatible with new columns.

### Column Pinning

- State: `columnPinning`
- Setters:
  - `table.setColumnPinning(updater)`
  - `table.pinColumn(columnId, position)`
- Read APIs:
  - `table.getLeftVisibleColumns()`
  - `table.getCenterVisibleColumns()`
  - `table.getRightVisibleColumns()`

`getVisibleColumns()` returns render order: left pinned, center, right pinned.

### Row Expansion

- State: `expanded`
- Setters:
  - `table.setExpanded(updater)`
  - `table.toggleRowExpanded(rowId, expanded?)`
- Row helpers:
  - `row.getCanExpand()`
  - `row.getIsExpanded()`
  - `row.toggleExpanded(expanded?)`
- Data hook: `getSubRows`
- Manual mode: `manualExpanding`

Nested rows are available via `getRow(rowId)` even when collapsed.

### Virtualization Compatibility

- Core utility: `getVirtualItems(options)`
- React hook: `useVirtualRows(table, options)`

The utility returns offsets and visible item windows. It does not measure DOM.

### Persistence and Debugging

- Persistence:
  - `table.getSerializableState(keys?)`
  - `table.hydrateState(updater)`
- Debug:
  - `debug`
  - `table.getDebugSnapshot()`

These APIs operate on plain data so they work in React, non-React runtimes, and
devtools.

## Scaffolded Features

### Grouping and Aggregation

- State: `grouping`
- Setter: `table.setGrouping(updater)`
- Callback: `onGroupingChange`

Grouping state is implemented for controlled/server-side integrations and future
client grouped row models. A full grouped row model with aggregation should land
as a feature-local row-model stage rather than in the central table factory.
