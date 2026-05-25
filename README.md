# react-smart-tablex

Headless, extensible, high-performance table primitives for React.

`react-smart-tablex` gives you the table engine and stays out of your markup. It
manages column normalization, row models, state updates, memoization boundaries,
sorting, filtering, pagination, column visibility, and row selection while you
keep full control over the rendered UI.

## Why react-smart-tablex?

- Headless by default: render plain tables, custom grids, cards, or any design
  system component you already use.
- TypeScript-first columns and cell renderers.
- Stable table instance with subscribable state.
- Client-side sorting, filtering, pagination, visibility, and selection.
- Manual/server-side modes for sorting, filtering, and pagination.
- Framework-agnostic core with a lightweight React adapter.
- ESM, CommonJS, and type declaration builds.

## Installation

```bash
npm install react-smart-tablex
```

React is a peer dependency:

```bash
npm install react react-dom
```

## Quick Start

```tsx
import { TableX, createColumnHelper, useTableX } from 'react-smart-tablex';

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
  const table = useTableX<Person>({
    data,
    columns,
    getRowId: (row) => row.id
  });

  return <TableX table={table} emptyState="No rows found." />;
}
```

`TableX` is a small convenience renderer for semantic HTML tables. You can also
render everything yourself.

## Render Your Own Markup

```tsx
import { flexRender } from 'react-smart-tablex';

function CustomTable() {
  const table = useTableX<Person>({
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

## Controlled State

Pass `state` plus feature callbacks when you want React to own part of the table
state.

```tsx
import { useState } from 'react';
import type { PaginationState, SortingState } from 'react-smart-tablex';

function ControlledTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });

  const table = useTableX<Person>({
    data,
    columns,
    state: {
      sorting,
      pagination
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination
  });

  return <TableX table={table} />;
}
```

Supported state slices:

- `columnVisibility`
- `sorting`
- `pagination`
- `rowSelection`
- `columnFilters`

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
`react-smart-tablex` performs a case-insensitive string inclusion check.

```tsx
table.setColumnFilters([{ id: 'name', value: 'avery' }]);
```

Add a `filterFn` for custom filtering:

```tsx
column.accessor('score', {
  header: 'Score',
  filterFn: (row, columnId, filterValue) =>
    row.getValue<number>(columnId) >= Number(filterValue)
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
```

## Column Visibility

Set a column ID to `false` to hide it. Omitted columns remain visible.

```tsx
const table = useTableX<Person>({
  data,
  columns,
  state: {
    columnVisibility: {
      role: false
    }
  }
});
```

## Server-Side Data

When your API handles row transforms, enable the matching manual flags. The
table will preserve state and skip the client-side transform.

```tsx
const table = useTableX<Person>({
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

### `useTableX(options)`

Creates and subscribes to a stable table instance in React.

```tsx
const table = useTableX({
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
  manualPagination,
  manualSorting,
  manualFiltering,
  features
});
```

### `createTableX(options)`

Creates the same table instance without React. Import it from the root package
or the core subpath.

```ts
import { createTableX } from 'react-smart-tablex/core';
```

### `TableX`

Renders a basic semantic table using the table instance.

```tsx
<TableX table={table} className="people-table" emptyState="No rows found." />
```

All standard `<table>` props are forwarded except `children`.

### Table Instance Methods

- `getOptions()`
- `setOptions(options)`
- `getState()`
- `setState(updater)`
- `subscribe(listener)`
- `getAllColumns()`
- `getVisibleColumns()`
- `getHeaderGroups()`
- `getCoreRowModel()`
- `getFilteredRowModel()`
- `getSortedRowModel()`
- `getPaginationRowModel()`
- `getRowModel()`
- `setSorting(updater)`
- `setPagination(updater)`
- `setColumnFilters(updater)`
- `setRowSelection(updater)`
- `toggleRowSelected(rowId, selected?)`
- `getIsRowSelected(rowId)`
- `getCellContext(cell)`
- `getHeaderContext(header)`

## Import Paths

```ts
import { useTableX, TableX } from 'react-smart-tablex';
import { createTableX } from 'react-smart-tablex/core';
import { flexRender } from 'react-smart-tablex/react';
```

The package exposes:

- `react-smart-tablex`: core, React adapter, and built-in feature exports.
- `react-smart-tablex/core`: framework-agnostic engine exports.
- `react-smart-tablex/react`: React adapter exports.

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

## License

MIT
