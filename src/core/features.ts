import { columnSizingFeature } from '../features/column-sizing/index.js';
import { columnOrderingFeature } from '../features/column-ordering/index.js';
import { columnPinningFeature } from '../features/column-pinning/index.js';
import { columnVisibilityFeature } from '../features/column-visibility/index.js';
import { expandingFeature } from '../features/expanding/index.js';
import { groupingFeature } from '../features/grouping/index.js';
import type { TableFeature } from './types.js';

const builtInFeatures = [
  columnVisibilityFeature,
  columnSizingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  expandingFeature,
  groupingFeature
] as const;

export function resolveTableFeatures<TData>(
  features?: readonly TableFeature<TData>[]
): TableFeature<TData>[] {
  const resolved = [
    ...(builtInFeatures as readonly TableFeature<TData>[]),
    ...(features ?? [])
  ];
  const names = new Set<string>();

  return resolved.filter((feature) => {
    if (names.has(feature.name)) {
      return false;
    }

    names.add(feature.name);
    return true;
  });
}
