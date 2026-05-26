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
} from '../../../src/index.ts';
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

const data: Person[] = [
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
          },
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
      <span className={`status status-${getValue().toLowerCase()}`}>
        {getValue()}
      </span>
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
    data,
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
  const orderedColumnIds = table.getAllColumns().map((item) => item.id);

  const toggleScoreSort = () => {
    table.setSorting((previous) => {
      const current = previous[0];

      if (current?.id !== 'score') {
        return [{ id: 'score', desc: true }];
      }

      return current.desc ? [{ id: 'score', desc: false }] : [];
    });
  };

  const moveScoreAfterName = () => {
    table.setColumnOrder(['select', 'name', 'score', 'role', 'status', 'location']);
  };

  const pinName = () => table.pinColumn('name', 'left');
  const unpinName = () => table.pinColumn('name', false);

  return (
    <main>
      <header>
        <div>
          <p>dx-data-table</p>
          <h1>Headless table feature playground</h1>
        </div>
        <div className="header-actions">
          <label>
            <input
              type="checkbox"
              checked={hideLocation}
              onChange={(event) => setHideLocation(event.target.checked)}
            />
            Hide location
          </label>
        </div>
      </header>

      <section className="toolbar">
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
        <button type="button" onClick={moveScoreAfterName}>
          Move score
        </button>
        <button type="button" onClick={() => table.resetColumnOrder()}>
          Reset order
        </button>
        <button type="button" onClick={pinName}>
          Pin name
        </button>
        <button type="button" onClick={unpinName}>
          Unpin name
        </button>
        <button type="button" onClick={() => table.toggleAllFilteredRowsSelected(true)}>
          Select filtered
        </button>
      </section>

      <section className="summary" aria-label="Table state summary">
        <span>{selectedCount} selected</span>
        <span>{rowCount} visible rows</span>
        <span>Order: {orderedColumnIds.join(' -> ')}</span>
        <span>
          Pinned: left {table.getLeftVisibleColumns().length}, right{' '}
          {table.getRightVisibleColumns().length}
        </span>
        <span>
          Models: core {debugRows.core}, filtered {debugRows.filtered}, sorted{' '}
          {debugRows.sorted}, page {debugRows.paginated}
        </span>
      </section>

      <div className="table-shell">
        <FeatureTable table={table} />
      </div>

      <footer>
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
    </main>
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
                      right:
                        pin === 'right' ? columnOffsets.right[cell.column.id] : undefined
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
