import { createRowModelFromRows } from '../../core/row-model.js';
import type { ExpandedState, Row, RowModel, TableFeature } from '../../core/types.js';

export const expandingFeature: TableFeature<unknown> = {
  name: 'expanding',
  getInitialState: (state) => ({
    ...state,
    expanded: state.expanded
  })
};

export function getNextExpandedState(
  state: ExpandedState,
  rowId: string,
  expanded?: boolean
): ExpandedState {
  const nextExpanded = expanded ?? !state[rowId];
  const nextState = { ...state };

  if (nextExpanded) {
    nextState[rowId] = true;
  } else {
    delete nextState[rowId];
  }

  return nextState;
}

export function createExpandedRowModel<TData>(
  rowModel: RowModel<TData>,
  expanded: ExpandedState
): RowModel<TData> {
  const rows: Row<TData>[] = [];

  const visit = (row: Row<TData>) => {
    rows.push(row);

    if (expanded[row.id]) {
      row.subRows.forEach(visit);
    }
  };

  rowModel.rows.forEach(visit);

  return createRowModelFromRows(rows, rowModel.rowsById);
}
