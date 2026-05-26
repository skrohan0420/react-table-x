import { useMemo } from 'react';
import { getVirtualItems, type VirtualizerResult } from '../core/virtualization.js';
import type { Row, TableInstance } from '../core/types.js';

export interface UseVirtualRowsOptions {
  estimateSize: number | ((index: number) => number);
  scrollOffset: number;
  viewportSize: number;
  overscan?: number;
}

export interface UseVirtualRowsResult<TData> extends VirtualizerResult {
  rows: Row<TData>[];
}

export function useVirtualRows<TData>(
  table: TableInstance<TData>,
  options: UseVirtualRowsOptions
): UseVirtualRowsResult<TData> {
  const rowModel = table.getRowModel();

  return useMemo(() => {
    const result = getVirtualItems({
      count: rowModel.rows.length,
      estimateSize: options.estimateSize,
      scrollOffset: options.scrollOffset,
      viewportSize: options.viewportSize,
      ...(options.overscan === undefined ? {} : { overscan: options.overscan })
    });

    return {
      ...result,
      rows: result.virtualItems.map((item) => rowModel.rows[item.index]!)
    };
  }, [
    rowModel,
    options.estimateSize,
    options.scrollOffset,
    options.viewportSize,
    options.overscan
  ]);
}
