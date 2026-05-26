# dx-data-table

Headless, extensible, high-performance table primitives for React.

`dx-data-table` gives you the table engine and stays out of your markup. It
manages column normalization, row models, state updates, memoization boundaries,
sorting, filtering, pagination, column visibility, and row selection while you
keep full control over the rendered UI.

## Why dx-data-table?

- Headless by default: render plain tables, custom grids, cards, or any design
  system component you already use.
- TypeScript-first columns and cell renderers.
- Stable table instance with subscribable state.
- Client-side sorting, filtering, pagination, visibility, and selection.
- Manual/server-side modes for sorting, filtering, and pagination.
- Framework-agnostic core with a lightweight React adapter.
- Headless column sizing, state persistence, debug snapshots, and virtual-row
  utilities.
- ESM, CommonJS, and type declaration builds.

## Installation

```bash
npm install dx-data-table
```

React is a peer dependency:

```bash
npm install react react-dom
```

## Quick Start

```tsx
import { Table, createColumnHelper, useTable } from 'dx-data-table';

type Person = {
  id: string;
  name: string;
  role: string;
  score: number;
};

const data: Person[] = [
  { id: '1', name: 'Avery Stone', role: 'Design Systems', score: 92 },
  { id: '2', name: 'Mira Patel', role: 'Data Platform', score: 81 }
];

const column = createColumnHelper<Person>();

const columns = [
  column.display({
    id: 'select',
    header: '',
    cell: ({ table, row }) => (
      <input
        type="checkbox"
        checked={table.getIsRowSelected(row.id)}
        onChange={(event) => table.toggleRowSelected(row.id, event.target.checked)}
      />
    )
  }),
  column.accessor('name', {
    header: 'Name'
  }),
  column.accessor('role', {
    header: 'Role'
  }),
  column.accessor('score', {
    header: 'Score',
    cell: ({ getValue }) => <strong>{getValue()}</strong>
  })
];

function PeopleTable() {
  const table = useTable<Person>({
    data,
    columns,
    getRowId: (row) => row.id
  });

  return <Table table={table} emptyState="No rows found." />;
}
```

`Table` is a small convenience renderer for semantic HTML tables. Production
apps will often render their own markup with the same table instance.

## Render Your Own Markup

```tsx
import { flexRender } from 'dx-data-table';

function CustomTable() {
  const table = useTable<Person>({
    data,
    columns,
    getRowId: (row) => row.id
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {flexRender(
                  header.column.columnDef.header ?? header.column.id,
                  table.getHeaderContext(header)
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(
                  cell.column.columnDef.cell ?? cell.renderValue(),
                  table.getCellContext(cell)
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Column Definitions

Columns can use an `accessorKey`:

```tsx
const columns = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'score',
    header: 'Score',
    cell: ({ getValue }) => getValue<number>()
  }
];
```

For stronger inference, use `createColumnHelper`:

```tsx
const column = createColumnHelper<Person>();

const columns = [
  column.accessor('name', {
    header: 'Name'
  }),
  column.accessor((row) => row.score, {
    id: 'score',
    header: 'Score'
  })
];
```

Accessor functions require an explicit `id` so the table can track sorting,
filtering, visibility, and cell identity.

Use `column.display(...)` for selection, actions, menus, or any column that does
not read a value from the original row.

## Controlled State

Pass `state` plus feature callbacks when you want React to own part of the table
state.

```tsx
import { useState } from 'react';
import type { PaginationState, SortingState } from 'dx-data-table';

function ControlledTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });

  const table = useTable<Person>({
    data,
    columns,
    state: {
      sorting,
      pagination
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination
  });

  return <Table table={table} />;
}
```

Supported state slices:

- `columnVisibility`
- `sorting`
- `pagination`
- `rowSelection`
- `columnFilters`
- `columnSizing`
- `columnOrder`
- `columnPinning`
- `expanded`
- `globalFilter`
- `grouping`

## Sorting

Sorting state is an array of `{ id, desc }` objects. The built-in sorter handles
numbers, strings, dates, `null`, and `undefined`, and keeps equal values stable.

```tsx
table.setSorting([{ id: 'score', desc: true }]);
```

Use a custom `sortingFn` when a column needs domain-specific behavior:

```tsx
column.accessor('score', {
  header: 'Score',
  sortingFn: (rowA, rowB, columnId) =>
    rowA.getValue<number>(columnId) - rowB.getValue<number>(columnId)
});
```

## Filtering

Filtering state is an array of `{ id, value }` objects. By default,
`dx-data-table` performs a case-insensitive string inclusion check.

```tsx
table.setColumnFilters([{ id: 'name', value: 'avery' }]);
table.setGlobalFilter('platform');
```

Add a `filterFn` for custom filtering:

```tsx
column.accessor('score', {
  header: 'Score',
  filterFn: (row, columnId, filterValue) =>
    row.getValue<number>(columnId) >= Number(filterValue)
});
```

Disable global filtering for columns that should not participate in search:

```tsx
column.accessor('score', {
  header: 'Score',
  enableGlobalFilter: false
});
```

## Pagination

Pagination uses zero-based `pageIndex` and a positive `pageSize`.

```tsx
table.setPagination((previous) => ({
  ...previous,
  pageIndex: previous.pageIndex + 1
}));
```

## Row Selection

Use row IDs for selection. Provide `getRowId` when your rows have stable
application IDs.

```tsx
table.toggleRowSelected(row.id);
table.toggleRowSelected(row.id, true);
table.getIsRowSelected(row.id);
table.toggleAllPageRowsSelected(true);
table.toggleAllFilteredRowsSelected(false);
table.getIsAllPageRowsSelected();
table.getIsSomePageRowsSelected();
```

## Column Visibility

Set a column ID to `false` to hide it. Omitted columns remain visible.

```tsx
const table = useTable<Person>({
  data,
  columns,
  state: {
    columnVisibility: {
      role: false
    }
  }
});
```

Columns with `enableHiding: false` stay visible even if their ID is set to
`false`.

## Column Ordering

Column order is state-driven and works with custom drag-and-drop libraries.

```tsx
table.setColumnOrder(['select', 'name', 'score', 'role']);
table.resetColumnOrder();
table.getAllColumns().map((column) => column.id);
```

Omitted column IDs are appended in their original definition order, which makes
stored preferences resilient to newly-added columns.

## Column Pinning

Pinning is headless: the table returns pinned column groups, and your renderer
chooses whether to use sticky positioning, split tables, or a grid layout.

```tsx
table.pinColumn('name', 'left');
table.pinColumn('score', 'right');
table.pinColumn('name', false);

table.getLeftVisibleColumns();
table.getCenterVisibleColumns();
table.getRightVisibleColumns();
```

`getVisibleColumns()` returns columns in render order: left pinned, center, then
right pinned.

## Row Expansion

Provide `getSubRows` for tree data or master/detail rows. Expanded rows are
flattened before pagination so page sizes reflect what users see.

```tsx
const table = useTable<Person>({
  data,
  columns,
  getRowId: (row) => row.id,
  getSubRows: (row) => row.children
});

row.getCanExpand();
row.getIsExpanded();
row.toggleExpanded();
table.toggleRowExpanded(row.id, true);
```

Use `manualExpanding` when the server already returns the expanded shape.

## Grouping Scaffold

Grouping state is available for controlled integrations and future grouped row
models. Today it does not transform rows by itself; use it to persist user
intent or coordinate server-side grouping.

```tsx
table.setGrouping(['role']);
table.getState().grouping;
```

A full grouped row model with aggregation is intentionally left as a separate
feature so simple tables do not pay for grouping machinery.

## Lookups

Lookup APIs avoid repeated scans in renderers, devtools, and interaction code.

```tsx
const scoreColumn = table.getColumn('score');
const selectedRow = table.getRow('user-1');
```

`getRow` reads from the core row map, so nested rows are available even when
their parent is collapsed.

## Column Sizing

Column sizing is headless state. Define defaults on a column and render widths
however your UI layer prefers.

```tsx
const columns = [
  column.accessor('name', {
    header: 'Name',
    size: 220,
    minSize: 120,
    maxSize: 360
  })
];

table.setColumnSize('name', 260);
table.getColumnSize('name'); // 260, clamped to min/max
table.resetColumnSizing();
```

Control it with `state.columnSizing` and `onColumnSizingChange` when storing
sizes in React, local storage, or a server profile.

To make a draggable resize handle, update the size from pointer movement:

```tsx
import type { Header, TableInstance } from 'dx-data-table';

function ResizableHeader({
  header,
  table
}: {
  header: Header<Person>;
  table: TableInstance<Person>;
}) {
  const startResize = (event: React.PointerEvent) => {
    event.preventDefault();

    const startX = event.clientX;
    const startSize = table.getColumnSize(header.column.id);

    const onPointerMove = (moveEvent: PointerEvent) => {
      table.setColumnSize(
        header.column.id,
        startSize + moveEvent.clientX - startX
      );
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  };

  return (
    <th style={{ width: table.getColumnSize(header.column.id) }}>
      {flexRender(
        header.column.columnDef.header ?? header.column.id,
        table.getHeaderContext(header)
      )}
      <button
        aria-label={`Resize ${header.column.id}`}
        type="button"
        onPointerDown={startResize}
      />
    </th>
  );
}
```

The built-in `Table` convenience renderer applies the current column widths, but
it does not render resize handles.

## Virtualization Compatibility

The library does not ship a DOM virtualizer, but it exposes a tiny row-window
calculator that prepares the row model for TanStack Virtual-style rendering or a
custom scroller.

```tsx
import { useVirtualRows } from 'dx-data-table/react';

const virtual = useVirtualRows(table, {
  estimateSize: 36,
  scrollOffset,
  viewportSize,
  overscan: 4
});
```

For framework-agnostic usage, import `getVirtualItems` from `dx-data-table/core`.

## State Persistence

Serialize only the slices you want to persist:

```ts
const saved = table.getSerializableState([
  'sorting',
  'columnFilters',
  'columnVisibility',
  'columnSizing'
]);

localStorage.setItem('people-table', JSON.stringify(saved));
table.hydrateState(JSON.parse(localStorage.getItem('people-table') ?? '{}'));
```

`hydrateState` merges with the current state, so omitted slices keep their
existing values.

## Debugging

Set `debug` while developing to inspect state updates and row-model counts.

```ts
const table = createTable({
  data,
  columns,
  debug: { state: true, warnings: true }
});

console.table(table.getDebugSnapshot().rows);
```

Warnings are enabled by default for invalid runtime operations such as sizing an
unknown column. Pass `debug: false` to silence them.

## Server-Side Data

When your API handles row transforms, enable the matching manual flags. The
table will preserve state and skip the client-side transform.

```tsx
const table = useTable<Person>({
  data,
  columns,
  state: {
    sorting,
    columnFilters,
    pagination
  },
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onPaginationChange: setPagination,
  manualSorting: true,
  manualFiltering: true,
  manualPagination: true
});
```

## API Overview

### `useTable(options)`

Creates and subscribes to a stable table instance in React.

```tsx
const table = useTable({
  data,
  columns,
  getRowId,
  state,
  initialState,
  onStateChange,
  onSortingChange,
  onPaginationChange,
  onRowSelectionChange,
  onColumnFiltersChange,
  onColumnSizingChange,
  onColumnOrderChange,
  onColumnPinningChange,
  onExpandedChange,
  onGlobalFilterChange,
  onGroupingChange,
  getSubRows,
  globalFilterFn,
  manualPagination,
  manualSorting,
  manualFiltering,
  manualExpanding,
  debug,
  features
});
```

### `createTable(options)`

Creates the same table instance without React. Import it from the root package
or the core subpath.

```ts
import { createTable } from 'dx-data-table/core';
```

### `Table`

Renders a basic semantic table using the table instance.

```tsx
<Table table={table} className="people-table" emptyState="No rows found." />
```

All standard `<table>` props are forwarded except `children`.

### Table Instance Methods

- `getOptions()`
- `setOptions(options)`
- `getState()`
- `setState(updater)`
- `subscribe(listener)`
- `getAllColumns()`
- `getColumn(columnId)`
- `getVisibleColumns()`
- `getLeftVisibleColumns()`
- `getCenterVisibleColumns()`
- `getRightVisibleColumns()`
- `getHeaderGroups()`
- `getRow(rowId)`
- `getCoreRowModel()`
- `getFilteredRowModel()`
- `getSortedRowModel()`
- `getExpandedRowModel()`
- `getPaginationRowModel()`
- `getRowModel()`
- `setSorting(updater)`
- `setPagination(updater)`
- `setColumnFilters(updater)`
- `setGlobalFilter(updater)`
- `setRowSelection(updater)`
- `toggleAllPageRowsSelected(selected?)`
- `toggleAllFilteredRowsSelected(selected?)`
- `getIsAllPageRowsSelected()`
- `getIsSomePageRowsSelected()`
- `setColumnSizing(updater)`
- `setColumnSize(columnId, size)`
- `resetColumnSizing()`
- `getColumnSize(columnId)`
- `setColumnOrder(updater)`
- `resetColumnOrder()`
- `setColumnPinning(updater)`
- `pinColumn(columnId, position)`
- `setExpanded(updater)`
- `toggleRowExpanded(rowId, expanded?)`
- `setGrouping(updater)`
- `toggleRowSelected(rowId, selected?)`
- `getIsRowSelected(rowId)`
- `getSerializableState(keys?)`
- `hydrateState(updater)`
- `subscribeToState(selector, listener, isEqual?)`
- `getDebugSnapshot()`
- `getCellContext(cell)`
- `getHeaderContext(header)`

## Import Paths

```ts
import { useTable, Table } from 'dx-data-table';
import { createTable } from 'dx-data-table/core';
import { flexRender, useTableState } from 'dx-data-table/react';
import { columnSizingFeature } from 'dx-data-table/features';
```

The package exposes:

- `dx-data-table`: core, React adapter, and built-in feature exports.
- `dx-data-table/core`: framework-agnostic engine exports.
- `dx-data-table/react`: React adapter exports.
- `dx-data-table/features`: feature modules and feature utilities.

## Local Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run TypeScript checks:

```bash
npm run typecheck
```

Run benchmarks:

```bash
npm run benchmark
```

Build the package:

```bash
npm run build
```

Run the example app:

```bash
npm run example
```

Then open `http://127.0.0.1:5173`.

## Publishing Checklist

Before publishing to npm:

```bash
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

Review the generated file list from `npm pack --dry-run` and then publish:

```bash
npm publish
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the package boundaries,
row-model pipeline, feature system, and performance rules.

See [docs/FEATURES.md](docs/FEATURES.md) for the feature-by-feature API guide
and implementation status.

## License

MIT
