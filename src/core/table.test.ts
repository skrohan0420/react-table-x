import { describe, expect, it, vi } from 'vitest';
import { createTable } from './table.js';
import { createColumnHelper } from './column-helper.js';
import { getVirtualItems } from './virtualization.js';
import type { PaginationState, SortingState } from './types.js';

type Person = {
  id: string;
  name: string;
  role: string;
  score: number;
  children?: Person[];
};

const data: Person[] = [
  { id: 'a', name: 'Avery', role: 'Design', score: 90 },
  { id: 'b', name: 'Blair', role: 'Engineering', score: 80 },
  { id: 'c', name: 'Casey', role: 'Engineering', score: 90 },
  { id: 'd', name: 'Devon', role: 'Support', score: 70 }
];

const column = createColumnHelper<Person>();

const columns = [
  column.accessor('name', { header: 'Name' }),
  column.accessor('role', { header: 'Role' }),
  column.accessor('score', { header: 'Score' })
];

describe('createTable', () => {
  it('caches accessor values per row and column', () => {
    const accessorFn = vi.fn((row: Person) => row.score * 2);
    const table = createTable({
      data,
      getRowId: (row) => row.id,
      columns: [
        column.accessor('name', { header: 'Name' }),
        column.accessor(accessorFn, {
          id: 'doubleScore',
          header: 'Double score'
        })
      ]
    });
    const [row] = table.getCoreRowModel().rows;

    expect(row?.getValue('doubleScore')).toBe(180);
    expect(row?.getValue('doubleScore')).toBe(180);
    expect(row?.getAllCells()[1]?.getValue()).toBe(180);
    expect(accessorFn).toHaveBeenCalledTimes(1);
  });

  it('keeps sorting stable for equal values', () => {
    const table = createTable({
      data,
      columns,
      getRowId: (row) => row.id,
      initialState: {
        sorting: [{ id: 'score', desc: true }],
        pagination: { pageIndex: 0, pageSize: 10 }
      }
    });

    expect(table.getRowModel().rows.map((row) => row.id)).toEqual([
      'a',
      'c',
      'b',
      'd'
    ]);
  });

  it('filters before sorting and pagination', () => {
    const table = createTable({
      data,
      columns,
      getRowId: (row) => row.id,
      initialState: {
        columnFilters: [{ id: 'role', value: 'engineering' }],
        sorting: [{ id: 'score', desc: false }],
        pagination: { pageIndex: 0, pageSize: 1 }
      }
    });

    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual([
      'b',
      'c'
    ]);
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(['b']);
  });

  it('skips client pagination when manualPagination is enabled', () => {
    const table = createTable({
      data,
      columns,
      manualPagination: true,
      initialState: {
        pagination: { pageIndex: 1, pageSize: 1 }
      }
    });

    expect(table.getRowModel().rows).toHaveLength(data.length);
  });

  it('calls controlled feature callbacks without forcing controlled state forward', () => {
    const onSortingChange = vi.fn();
    const sorting: SortingState = [];
    const table = createTable({
      data,
      columns,
      state: { sorting },
      onSortingChange
    });

    table.setSorting([{ id: 'score', desc: true }]);

    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'score', desc: true }]);
    expect(table.getState().sorting).toBe(sorting);
  });

  it('does not rebuild the core row model when only column visibility changes', () => {
    const table = createTable({
      data,
      columns,
      getRowId: (row) => row.id
    });
    const before = table.getCoreRowModel();

    table.setState((previous) => ({
      ...previous,
      columnVisibility: { role: false }
    }));

    expect(table.getCoreRowModel()).toBe(before);
    expect(table.getVisibleCells(before.rows[0]!).map((cell) => cell.column.id)).toEqual([
      'name',
      'score'
    ]);
  });

  it('emits pagination updaters and updates uncontrolled pagination', () => {
    const onPaginationChange = vi.fn();
    const table = createTable({
      data,
      columns,
      getRowId: (row) => row.id,
      onPaginationChange,
      initialState: {
        pagination: { pageIndex: 0, pageSize: 2 }
      }
    });
    const updater = (previous: PaginationState) => ({
      ...previous,
      pageIndex: previous.pageIndex + 1
    });

    table.setPagination(updater);

    expect(onPaginationChange).toHaveBeenCalledWith(updater);
    expect(table.getState().pagination).toEqual({ pageIndex: 1, pageSize: 2 });
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(['c', 'd']);
  });

  it('clamps and persists column sizing state', () => {
    const table = createTable({
      data,
      columns: [
        column.accessor('name', {
          header: 'Name',
          size: 180,
          minSize: 120,
          maxSize: 240
        })
      ]
    });

    expect(table.getColumnSize('name')).toBe(180);

    table.setColumnSize('name', 80);
    expect(table.getColumnSize('name')).toBe(120);
    expect(table.getSerializableState(['columnSizing'])).toEqual({
      columnSizing: { name: 120 }
    });

    table.hydrateState({ columnSizing: { name: 220 } });
    expect(table.getColumnSize('name')).toBe(220);
  });

  it('notifies selector subscribers only when the selected state changes', () => {
    const listener = vi.fn();
    const table = createTable({
      data,
      columns
    });

    table.subscribeToState((state) => state.sorting, listener);
    table.setPagination({ pageIndex: 1, pageSize: 2 });
    table.setSorting([{ id: 'score', desc: true }]);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith([{ id: 'score', desc: true }], []);
  });

  it('returns virtual item offsets for visible row windows', () => {
    const virtual = getVirtualItems({
      count: 100,
      estimateSize: 25,
      scrollOffset: 50,
      viewportSize: 75,
      overscan: 1
    });

    expect(virtual.totalSize).toBe(2500);
    expect(virtual.virtualItems.map((item) => item.index)).toEqual([
      0,
      1,
      2,
      3,
      4,
      5
    ]);
    expect(virtual.offsetAfter).toBe(2350);
  });

  it('orders and pins visible columns', () => {
    const table = createTable({
      data,
      columns,
      initialState: {
        columnOrder: ['score', 'name', 'role'],
        columnPinning: { left: ['role'], right: ['score'] }
      }
    });

    expect(table.getAllColumns().map((item) => item.id)).toEqual([
      'score',
      'name',
      'role'
    ]);
    expect(table.getVisibleColumns().map((item) => item.id)).toEqual([
      'role',
      'name',
      'score'
    ]);
    expect(table.getLeftVisibleColumns().map((item) => item.id)).toEqual(['role']);
    expect(table.getRightVisibleColumns().map((item) => item.id)).toEqual(['score']);
  });

  it('applies global filtering across filterable columns', () => {
    const table = createTable({
      data,
      columns,
      getRowId: (row) => row.id,
      initialState: {
        globalFilter: 'support'
      }
    });

    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual(['d']);

    table.setGlobalFilter('avery');
    expect(table.getFilteredRowModel().rows.map((row) => row.id)).toEqual(['a']);
  });

  it('expands nested rows before pagination', () => {
    const nestedData: Person[] = [
      {
        id: 'parent',
        name: 'Parent',
        role: 'Team',
        score: 1,
        children: [
          { id: 'child', name: 'Child', role: 'Team', score: 2 }
        ]
      }
    ];
    const table = createTable({
      data: nestedData,
      columns,
      getRowId: (row) => row.id,
      getSubRows: (row) => row.children,
      initialState: {
        pagination: { pageIndex: 0, pageSize: 10 }
      }
    });

    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(['parent']);

    table.toggleRowExpanded('parent', true);

    expect(table.getRow('child')?.parentId).toBe('parent');
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual([
      'parent',
      'child'
    ]);
  });

  it('supports lookup APIs and bulk page selection', () => {
    const table = createTable({
      data,
      columns,
      getRowId: (row) => row.id,
      initialState: {
        pagination: { pageIndex: 0, pageSize: 2 }
      }
    });

    expect(table.getColumn('score')?.id).toBe('score');
    expect(table.getRow('a')?.original.name).toBe('Avery');

    table.toggleAllPageRowsSelected(true);

    expect(table.getIsAllPageRowsSelected()).toBe(true);
    expect(table.getIsSomePageRowsSelected()).toBe(true);
    expect(Object.keys(table.getState().rowSelection)).toEqual(['a', 'b']);
  });

  it('stores grouping state for controlled grouping integrations', () => {
    const onGroupingChange = vi.fn();
    const table = createTable({
      data,
      columns,
      onGroupingChange
    });

    table.setGrouping(['role']);

    expect(onGroupingChange).toHaveBeenCalledWith(['role']);
    expect(table.getState().grouping).toEqual(['role']);
  });
});
