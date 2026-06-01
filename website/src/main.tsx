import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createColumnHelper,
  flexRender,
  useTable,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type Header,
  type PaginationState,
  type SortingState,
  type TableInstance
} from '../../src/index.ts';
import './styles.css';

type Person = {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Away' | 'Offline';
  score: number;
  location: string;
  children?: Person[];
};

const people: Person[] = [
  {
    id: '1',
    name: 'Avery Stone',
    role: 'Design Systems',
    status: 'Active',
    score: 92,
    location: 'Austin',
    children: [
      {
        id: '1.1',
        name: 'Kai Morgan',
        role: 'Design Ops',
        status: 'Away',
        score: 84,
        location: 'Remote',
        children: [
          {
            id: '1.1.1',
            name: 'Luna Davis',
            role: 'Design Ops',
            status: 'Active',
            score: 77,
            location: 'Remote'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Mira Patel',
    role: 'Data Platform',
    status: 'Away',
    score: 81,
    location: 'New York'
  },
  {
    id: '3',
    name: 'Noah Kim',
    role: 'Frontend Infra',
    status: 'Active',
    score: 88,
    location: 'Seattle',
    children: [
      {
        id: '3.1',
        name: 'Owen Reed',
        role: 'Component Library',
        status: 'Active',
        score: 79,
        location: 'Portland'
      },
      {
        id: '3.2',
        name: 'Uma Shah',
        role: 'Accessibility',
        status: 'Offline',
        score: 91,
        location: 'Chicago'
      }
    ]
  },
  {
    id: '4',
    name: 'Leah Brooks',
    role: 'Product Engineering',
    status: 'Offline',
    score: 74,
    location: 'Denver'
  },
  {
    id: '5',
    name: 'Theo Carter',
    role: 'Developer Experience',
    status: 'Active',
    score: 95,
    location: 'Boston'
  },
  {
    id: '6',
    name: 'Iris Chen',
    role: 'Quality Engineering',
    status: 'Away',
    score: 79,
    location: 'San Francisco'
  },
  {
    id: '7',
    name: 'Sam Rivera',
    role: 'Release Engineering',
    status: 'Offline',
    score: 68,
    location: 'Phoenix'
  },
  {
    id: '8',
    name: 'Nina Walsh',
    role: 'Frontend Infra',
    status: 'Active',
    score: 86,
    location: 'Miami'
  }
];

const column = createColumnHelper<Person>();

const columns: ColumnDef<Person>[] = [
  column.display({
    id: 'select',
    header: ({ table }) => (
      <input
        aria-label="Select all rows on this page"
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        ref={(node) => {
          if (node) {
            node.indeterminate =
              table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
          }
        }}
        onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
      />
    ),
    cell: ({ table, row }) => (
      <input
        aria-label={`Select ${row.getValue<string>('name')}`}
        type="checkbox"
        checked={table.getIsRowSelected(row.id)}
        onChange={(event) => table.toggleRowSelected(row.id, event.target.checked)}
      />
    ),
    size: 52,
    minSize: 52,
    maxSize: 52,
    enableHiding: false
  }),
  column.accessor('name', {
    header: 'Name',
    size: 260,
    minSize: 180,
    cell: ({ row, getValue }) => (
      <div className="name-cell" style={{ paddingLeft: row.depth * 22 }}>
        {row.getCanExpand() ? (
          <button
            aria-label={`${row.getIsExpanded() ? 'Collapse' : 'Expand'} ${getValue()}`}
            className="icon-button"
            type="button"
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded() ? '-' : '+'}
          </button>
        ) : (
          <span className="tree-spacer" />
        )}
        <strong>{getValue()}</strong>
      </div>
    )
  }),
  column.accessor('role', {
    header: 'Role',
    size: 220
  }),
  column.accessor('status', {
    header: 'Status',
    size: 140,
    cell: ({ getValue }) => (
      <span className={`status status-${getValue().toLowerCase()}`}>{getValue()}</span>
    )
  }),
  column.accessor('location', {
    header: 'Location',
    size: 160
  }),
  column.accessor('score', {
    header: 'Score',
    size: 110,
    enableGlobalFilter: false,
    cell: ({ getValue }) => <strong>{getValue()}</strong>
  })
];

const quickStartCode = `import { Table, createColumnHelper, useTable } from 'dx-data-table';

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
  column.accessor('name', { header: 'Name' }),
  column.accessor('role', { header: 'Role' }),
  column.accessor('score', {
    header: 'Score',
    cell: ({ getValue }) => <strong>{getValue()}</strong>
  })
];

export function PeopleTable() {
  const table = useTable<Person>({
    data,
    columns,
    getRowId: (row) => row.id
  });

  return <Table table={table} emptyState="No rows found." />;
}`;

const customRenderCode = `import { flexRender, useTable } from 'dx-data-table';

function CustomTable() {
  const table = useTable({ data, columns, getRowId: (row) => row.id });

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
            {table.getVisibleCells(row).map((cell) => (
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
}`;

const serverDataCode = `const table = useTable<Person>({
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
});`;

const persistenceCode = `const saved = table.getSerializableState([
  'sorting',
  'columnFilters',
  'columnVisibility',
  'columnSizing'
]);

localStorage.setItem('people-table', JSON.stringify(saved));

table.hydrateState(
  JSON.parse(localStorage.getItem('people-table') ?? '{}')
);`;

const featureCards = [
  {
    title: 'Sorting and filtering',
    body: 'Use controlled state slices for predictable UX, or let the table own state for small screens and internal tools.',
    code: `table.setSorting([{ id: 'score', desc: true }]);
table.setGlobalFilter('platform');
table.setColumnFilters([{ id: 'status', value: 'Active' }]);`
  },
  {
    title: 'Pagination',
    body: 'Pagination is zero-based and composes after filtering, sorting, and expansion unless you enable manual pagination.',
    code: `table.setPagination((previous) => ({
  ...previous,
  pageIndex: previous.pageIndex + 1
}));`
  },
  {
    title: 'Selection',
    body: 'Selection keys are row IDs. Provide getRowId when your data already has durable application IDs.',
    code: `table.toggleRowSelected(row.id, true);
table.toggleAllPageRowsSelected();
table.getIsAllPageRowsSelected();`
  },
  {
    title: 'Pinning and sizing',
    body: 'The engine tracks dimensions and pinned groups while your renderer decides whether to use sticky cells, grids, or split views.',
    code: `table.pinColumn('name', 'left');
table.pinColumn('score', 'right');
table.setColumnSize('name', 260);`
  }
];

function App() {
  const [hideLocation, setHideLocation] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5
  });
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ['select', 'name'],
    right: ['score']
  });
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const table = useTable<Person>({
    data: people,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
    state: {
      columnVisibility: { location: !hideLocation },
      columnOrder,
      columnPinning,
      columnSizing,
      expanded,
      globalFilter,
      pagination,
      sorting
    },
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting
  });

  const selectedCount = Object.keys(table.getState().rowSelection).length;
  const rowCount = table.getExpandedRowModel().rows.length;
  const pageCount = Math.max(1, Math.ceil(rowCount / table.getState().pagination.pageSize));
  const debugRows = table.getDebugSnapshot().rows;

  const toggleScoreSort = () => {
    table.setSorting((previous) => {
      const current = previous[0];

      if (current?.id !== 'score') {
        return [{ id: 'score', desc: true }];
      }

      return current.desc ? [{ id: 'score', desc: false }] : [];
    });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Documentation navigation">
        <a className="brand" href="#top">
          <span>dx</span>
          <strong>dx-data-table</strong>
        </a>
        <nav>
          <a href="#quick-start">Quick start</a>
          <a href="#tutorial">Tutorial</a>
          <a href="#playground">Live demo</a>
          <a href="#recipes">Recipes</a>
          <a href="#api">API map</a>
        </nav>
      </aside>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">React table engine</p>
            <h1>Build fast, headless data tables without giving up your UI.</h1>
            <p className="lead">
              A practical documentation page for installing, rendering, controlling,
              and extending dx-data-table with real examples you can paste into an app.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#quick-start">
                Start tutorial
              </a>
              <a className="button" href="#playground">
                Try the demo
              </a>
            </div>
          </div>

          <div className="install-panel" aria-label="Install dx-data-table">
            <span>Install</span>
            <code>npm install dx-data-table</code>
            <small>React 18.2 or newer is a peer dependency.</small>
          </div>
        </section>

        <section className="section-grid" id="quick-start">
          <div>
            <p className="eyebrow">Quick start</p>
            <h2>From data to a working table</h2>
            <p>
              Define row data, create typed columns, pass both into `useTable`, and
              render with the included semantic `Table` component.
            </p>
          </div>
          <CodeBlock code={quickStartCode} />
        </section>

        <section id="tutorial">
          <p className="eyebrow">Tutorial path</p>
          <h2>Learn the library in four steps</h2>
          <div className="steps">
            <article>
              <span>01</span>
              <h3>Model your rows</h3>
              <p>
                Keep your original data shape. Add `getRowId` for durable selection,
                expansion, and persisted state.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Create columns</h3>
              <p>
                Use `createColumnHelper` for inference, accessor functions for computed
                values, and display columns for selection or actions.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Control features</h3>
              <p>
                Add state slices only when your app needs ownership. Sorting, filtering,
                pagination, pinning, sizing, and expansion all follow the same pattern.
              </p>
            </article>
            <article>
              <span>04</span>
              <h3>Own the markup</h3>
              <p>
                Use the bundled `Table` for a fast start or render custom markup with
                `flexRender` and the table instance.
              </p>
            </article>
          </div>
        </section>

        <section className="playground" id="playground">
          <div className="playground-header">
            <div>
              <p className="eyebrow">Live demo</p>
              <h2>Feature playground</h2>
            </div>
            <label className="check-control">
              <input
                type="checkbox"
                checked={hideLocation}
                onChange={(event) => setHideLocation(event.target.checked)}
              />
              Hide location
            </label>
          </div>

          <div className="toolbar">
            <input
              aria-label="Global search"
              placeholder="Search name, role, status, location"
              value={globalFilter}
              onChange={(event) => {
                table.setGlobalFilter(event.target.value);
                setPagination((previous) => ({ ...previous, pageIndex: 0 }));
              }}
            />
            <button type="button" onClick={toggleScoreSort}>
              Sort score
            </button>
            <button
              type="button"
              onClick={() => table.setColumnOrder(['select', 'name', 'score', 'role', 'status', 'location'])}
            >
              Move score
            </button>
            <button type="button" onClick={() => table.resetColumnOrder()}>
              Reset order
            </button>
            <button type="button" onClick={() => table.pinColumn('name', 'left')}>
              Pin name
            </button>
            <button type="button" onClick={() => table.pinColumn('name', false)}>
              Unpin name
            </button>
            <button type="button" onClick={() => table.toggleAllFilteredRowsSelected(true)}>
              Select filtered
            </button>
          </div>

          <div className="summary" aria-label="Table state summary">
            <span>{selectedCount} selected</span>
            <span>{rowCount} visible rows</span>
            <span>Core {debugRows.core}</span>
            <span>Filtered {debugRows.filtered}</span>
            <span>Page {debugRows.paginated}</span>
          </div>

          <div className="table-shell">
            <FeatureTable table={table} />
          </div>

          <footer className="pager">
            <button
              type="button"
              disabled={table.getState().pagination.pageIndex === 0}
              onClick={() =>
                table.setPagination((previous) => ({
                  ...previous,
                  pageIndex: previous.pageIndex - 1
                }))
              }
            >
              Previous
            </button>
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {pageCount}
            </span>
            <button
              type="button"
              disabled={table.getState().pagination.pageIndex + 1 >= pageCount}
              onClick={() =>
                table.setPagination((previous) => ({
                  ...previous,
                  pageIndex: previous.pageIndex + 1
                }))
              }
            >
              Next
            </button>
          </footer>
        </section>

        <section id="recipes">
          <p className="eyebrow">Recipes</p>
          <h2>Common implementation patterns</h2>
          <div className="recipe-grid">
            {featureCards.map((card) => (
              <article className="recipe-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                <CodeBlock code={card.code} compact />
              </article>
            ))}
          </div>
        </section>

        <section className="section-grid">
          <div>
            <p className="eyebrow">Custom markup</p>
            <h2>Render any table UI</h2>
            <p>
              The table instance exposes header groups, row models, cells, contexts,
              and state helpers so you can render plain tables, design-system grids,
              virtualized windows, or split pinned layouts.
            </p>
          </div>
          <CodeBlock code={customRenderCode} />
        </section>

        <section className="section-grid">
          <div>
            <p className="eyebrow">Production patterns</p>
            <h2>Server data and persistence</h2>
            <p>
              Enable manual modes when your API performs row transforms. Persist only
              the state slices that belong to a user preference.
            </p>
          </div>
          <div className="code-stack">
            <CodeBlock code={serverDataCode} />
            <CodeBlock code={persistenceCode} />
          </div>
        </section>

        <section id="api">
          <p className="eyebrow">API map</p>
          <h2>Where to import from</h2>
          <div className="api-list">
            <div>
              <strong>dx-data-table</strong>
              <span>Root package with core, React adapter, and feature exports.</span>
            </div>
            <div>
              <strong>dx-data-table/core</strong>
              <span>Framework-agnostic `createTable`, types, and row-model utilities.</span>
            </div>
            <div>
              <strong>dx-data-table/react</strong>
              <span>`useTable`, `Table`, `flexRender`, `useTableState`, and virtual rows.</span>
            </div>
            <div>
              <strong>dx-data-table/features</strong>
              <span>Feature modules for advanced composition and custom builds.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function CodeBlock({ code, compact = false }: { code: string; compact?: boolean }) {
  return (
    <pre className={compact ? 'code-block compact' : 'code-block'}>
      <code>{code}</code>
    </pre>
  );
}

function FeatureTable({ table }: { table: TableInstance<Person> }) {
  const rows = table.getRowModel().rows;
  const columnOffsets = useMemo(() => getColumnOffsets(table), [
    table,
    table.getState().columnPinning,
    table.getState().columnSizing,
    table.getState().columnVisibility,
    table.getState().columnOrder
  ]);

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <ResizableHeader
                key={header.id}
                header={header}
                table={table}
                offsets={columnOffsets}
              />
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row) => (
            <tr key={row.id} data-depth={row.depth}>
              {table.getVisibleCells(row).map((cell) => {
                const pin = getPinSide(table, cell.column.id);

                return (
                  <td
                    key={cell.id}
                    className={pin ? `is-pinned is-pinned-${pin}` : undefined}
                    style={{
                      width: table.getColumnSize(cell.column.id),
                      left: pin === 'left' ? columnOffsets.left[cell.column.id] : undefined,
                      right: pin === 'right' ? columnOffsets.right[cell.column.id] : undefined
                    }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell ?? cell.renderValue(),
                      table.getCellContext(cell)
                    )}
                  </td>
                );
              })}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={table.getVisibleColumns().length}>No rows found.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function ResizableHeader({
  header,
  offsets,
  table
}: {
  header: Header<Person>;
  offsets: ColumnOffsets;
  table: TableInstance<Person>;
}) {
  const pin = getPinSide(table, header.column.id);
  const sort = table.getState().sorting.find((item) => item.id === header.column.id);
  const startResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const startX = event.clientX;
    const startSize = table.getColumnSize(header.column.id);

    const onPointerMove = (moveEvent: PointerEvent) => {
      table.setColumnSize(header.column.id, startSize + moveEvent.clientX - startX);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  };

  const toggleSort = () => {
    if (!header.column.getCanSort()) {
      return;
    }

    table.setSorting((previous) => {
      const current = previous.find((item) => item.id === header.column.id);

      if (!current) {
        return [{ id: header.column.id, desc: false }];
      }

      return current.desc ? [] : [{ id: header.column.id, desc: true }];
    });
  };

  return (
    <th
      className={pin ? `is-pinned is-pinned-${pin}` : undefined}
      style={{
        width: table.getColumnSize(header.column.id),
        left: pin === 'left' ? offsets.left[header.column.id] : undefined,
        right: pin === 'right' ? offsets.right[header.column.id] : undefined
      }}
    >
      <div className="header-cell">
        <button className="header-sort" type="button" onClick={toggleSort}>
          {flexRender(
            header.column.columnDef.header ?? header.column.id,
            table.getHeaderContext(header)
          )}
          {sort ? <span>{sort.desc ? 'desc' : 'asc'}</span> : null}
        </button>
        <button
          aria-label={`Resize ${header.column.id}`}
          className="resize-handle"
          type="button"
          onPointerDown={startResize}
        />
      </div>
    </th>
  );
}

type ColumnOffsets = {
  left: Record<string, number>;
  right: Record<string, number>;
};

function getColumnOffsets(table: TableInstance<Person>): ColumnOffsets {
  const left: Record<string, number> = {};
  const right: Record<string, number> = {};
  let leftOffset = 0;
  let rightOffset = 0;

  table.getLeftVisibleColumns().forEach((columnItem) => {
    left[columnItem.id] = leftOffset;
    leftOffset += table.getColumnSize(columnItem.id);
  });

  [...table.getRightVisibleColumns()].reverse().forEach((columnItem) => {
    right[columnItem.id] = rightOffset;
    rightOffset += table.getColumnSize(columnItem.id);
  });

  return { left, right };
}

function getPinSide(table: TableInstance<Person>, columnId: string) {
  if (table.getLeftVisibleColumns().some((item) => item.id === columnId)) {
    return 'left';
  }

  if (table.getRightVisibleColumns().some((item) => item.id === columnId)) {
    return 'right';
  }

  return false;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
