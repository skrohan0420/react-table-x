import type { TableFeature } from '../../core/types.js';

export const groupingFeature: TableFeature<unknown> = {
  name: 'grouping',
  getInitialState: (state) => ({
    ...state,
    grouping: state.grouping
  })
};
