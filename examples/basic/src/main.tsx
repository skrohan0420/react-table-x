import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  TableX,
  createColumnHelper,
  useTableX,
  type ColumnDef,
  type PaginationState,
  type SortingState
} from '../../../src/index.ts';
import './styles.css';

type Person = {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Away' | 'Offline';
  score: number;
};

const data: Person[] = [
  { id: '1', name: 'Avery Stone', role: 'Design Systems', status: 'Active', score: 92 },
  { id: '2', name: 'Mira Patel', role: 'Data Platform', status: 'Away', score: 81 },
  { id: '3', name: 'Noah Kim', role: 'Frontend Infra', status: 'Active', score: 88 },
  { id: '4', name: 'Leah Brooks', role: 'Product Engineering', status: 'Offline', score: 74 },
  { id: '5', name: 'Theo Carter', role: 'Developer Experience', status: 'Active', score: 95 },
  { id: '6', name: 'Iris Chen', role: 'Quality Engineering', status: 'Away', score: 79 },
  { id: '7', name: 'Sam Rivera', role: 'Release Engineering', status: 'Offline', score: 68 },
  { id: '8', name: 'Nina Walsh', role: 'Frontend Infra', status: 'Active', score: 86 }
];

const column = createColumnHelper<Person>();

const columns: ColumnDef<Person>[] = [
  {
    id: 'select',
    header: '',
    cell: ({ table, row }) => (
      <input
        aria-label={`Select ${row.getValue<string>('name')}`}
        type="checkbox"
        checked={table.getIsRowSelected(row.id)}
        onChange={(event) => table.toggleRowSelected(row.id, event.target.checked)}
      />
    )
  },
  column.accessor('name', {
    header: 'Name'
  }),
  column.accessor('role', {
    header: 'Role'
  }),
  column.accessor('status', {
    header: 'Status',
    cell: ({ getValue }) => <span className="status">{getValue()}</span>
  }),
  column.accessor('score', {
    header: 'Score',
    cell: ({ getValue }) => <strong>{getValue()}</strong>
  })
];

function App() {
  const [hideRole, setHideRole] = useState(false);
  const [query, setQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 4
  });
  const table = useTableX<Person>({
    data,
    columns,
    getRowId: (row) => row.id,
    state: {
      columnVisibility: { role: !hideRole },
      sorting,
      columnFilters: query ? [{ id: 'name', value: query }] : [],
      pagination
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination
  });
  const selectedCount = Object.keys(table.getState().rowSelection).length;
  const pageCount = Math.max(
    1,
    Math.ceil(
      table.getSortedRowModel().rows.length / table.getState().pagination.pageSize
    )
  );

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
    <main>
      <header>
        <div>
          <p>react-smart-tablex</p>
          <h1>Headless table example</h1>
        </div>
        <label>
          <input
            type="checkbox"
            checked={hideRole}
            onChange={(event) => setHideRole(event.target.checked)}
          />
          Hide role
        </label>
      </header>

      <section className="toolbar">
        <input
          aria-label="Filter names"
          placeholder="Filter names"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPagination((previous) => ({ ...previous, pageIndex: 0 }));
          }}
        />
        <button type="button" onClick={toggleScoreSort}>
          Sort score
        </button>
        <span>{selectedCount} selected</span>
      </section>

      <TableX table={table} emptyState="No rows found." />

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
