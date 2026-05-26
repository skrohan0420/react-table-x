import { bench, describe } from 'vitest';
import { createColumnHelper, createTable } from '../src/core/index.js';

type BenchRow = {
  id: string;
  name: string;
  group: string;
  score: number;
};

const column = createColumnHelper<BenchRow>();

const columns = [
  column.accessor('name'),
  column.accessor('group'),
  column.accessor('score')
];

const data = Array.from({ length: 10_000 }, (_, index): BenchRow => ({
  id: String(index),
  name: `Row ${index}`,
  group: `Group ${index % 20}`,
  score: index % 100
}));

describe('react-table-x benchmarks', () => {
  /**
   * --------------------------------------------------------
   * Core Table Instance
   * --------------------------------------------------------
   */

  const baseTable = createTable({
    data,
    columns,
    getRowId: (row) => row.id
  });

  const pipelineTable = createTable({
    data,
    columns,
    getRowId: (row) => row.id,
    initialState: {
      columnFilters: [{ id: 'group', value: 'Group 1' }],
      sorting: [{ id: 'score', desc: true }],
      pagination: { pageIndex: 0, pageSize: 50 }
    }
  });

  /**
   * --------------------------------------------------------
   * Cold Start Benchmarks
   * Measures:
   * - instance creation
   * - row model initialization
   * - initial allocations
   * --------------------------------------------------------
   */

  describe('cold start', () => {
    bench('create table instance', () => {
      createTable({
        data,
        columns,
        getRowId: (row) => row.id
      });
    });

    bench('create + core row model', () => {
      createTable({
        data,
        columns,
        getRowId: (row) => row.id
      }).getCoreRowModel();
    });

    bench('create + full pipeline', () => {
      createTable({
        data,
        columns,
        getRowId: (row) => row.id,
        initialState: {
          columnFilters: [{ id: 'group', value: 'Group 1' }],
          sorting: [{ id: 'score', desc: true }],
          pagination: { pageIndex: 0, pageSize: 50 }
        }
      }).getRowModel();
    });
  });

  /**
   * --------------------------------------------------------
   * Warm / Cached Benchmarks
   * Measures:
   * - memoization quality
   * - cache reuse
   * - recomputation efficiency
   * --------------------------------------------------------
   */

  describe('warm cache', () => {
    // warm caches once
    baseTable.getCoreRowModel();
    pipelineTable.getRowModel();

    bench('cached core row model', () => {
      baseTable.getCoreRowModel();
    });

    bench('cached full row model', () => {
      pipelineTable.getRowModel();
    });
  });

  /**
   * --------------------------------------------------------
   * State Update Benchmarks
   * Measures:
   * - invalidation performance
   * - recomputation cost
   * - user interaction responsiveness
   * --------------------------------------------------------
   */

  describe('state updates', () => {
    bench('sorting update', () => {
      pipelineTable.setSorting([
        {
          id: 'score',
          desc: Math.random() > 0.5
        }
      ]);

      pipelineTable.getRowModel();
    });

    bench('filter update', () => {
      pipelineTable.setColumnFilters([
        {
          id: 'group',
          value: `Group ${Math.floor(Math.random() * 20)}`
        }
      ]);

      pipelineTable.getRowModel();
    });

    bench('pagination update', () => {
      pipelineTable.setPagination({
        pageIndex: Math.floor(Math.random() * 20),
        pageSize: 50
      });

      pipelineTable.getRowModel();
    });
  });

  /**
   * --------------------------------------------------------
   * Scalability Benchmarks
   * Measures:
   * - algorithmic scaling
   * - large dataset performance
   * --------------------------------------------------------
   */

  describe('large datasets', () => {
    const hugeData = Array.from(
      { length: 100_000 },
      (_, index): BenchRow => ({
        id: String(index),
        name: `Row ${index}`,
        group: `Group ${index % 20}`,
        score: index % 100
      })
    );

    const hugeTable = createTable({
      data: hugeData,
      columns,
      getRowId: (row) => row.id,
      initialState: {
        sorting: [{ id: 'score', desc: true }]
      }
    });

    bench('100k rows sorting pipeline', () => {
      hugeTable.getRowModel();
    });
  });
});