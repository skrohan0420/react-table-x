import { useRef, useSyncExternalStore } from 'react';
import type { TableInstance, TableState } from '../core/types.js';

export function useTableState<TData, TSelected>(
  table: TableInstance<TData>,
  selector: (state: TableState) => TSelected,
  isEqual: (a: TSelected, b: TSelected) => boolean = Object.is
): TSelected {
  const cacheRef = useRef<{
    state: TableState;
    selected: TSelected;
  }>();

  const getSnapshot = () => {
    const state = table.getState();
    const cached = cacheRef.current;

    if (cached?.state === state) {
      return cached.selected;
    }

    const selected = selector(state);

    if (cached && isEqual(selected, cached.selected)) {
      cacheRef.current = {
        state,
        selected: cached.selected
      };
      return cached.selected;
    }

    cacheRef.current = {
      state,
      selected
    };
    return selected;
  };

  return useSyncExternalStore(table.subscribe, getSnapshot, getSnapshot);
}
