# dx-data-table Architecture

## Design Goals

`dx-data-table` is a headless table engine. The core package must never depend
on React or DOM rendering. React is only an adapter around the reusable engine.

Phase 1 prioritizes:

- predictable performance boundaries
- type-safe column and row primitives
- controlled and uncontrolled state
- feature composition without a monolithic table component
- immutable source data handling
- a small API surface that can grow into advanced grid behavior

## Package Boundaries

```txt
src/
  core/      Framework-agnostic table engine
  features/  Isolated row-model and state feature modules
  react/     React adapter and React-specific rendering helpers
```

### Core

The core owns:

- table instance creation
- option normalization
- state store and subscriptions
- column normalization
- core row model generation
- memoization
- feature hooks

The core must not import React.

### React

The React adapter owns:

- `useTable`
- subscribing React renders to table state with `useSyncExternalStore`
- React rendering helpers such as `flexRender`

The adapter must not contain table business logic.

## Table Instance

The table instance is a stable object with methods:

- `getState`
- `setState`
- `getAllColumns`
- `getVisibleColumns`
- `getHeaderGroups`
- `getCoreRowModel`
- `getFilteredRowModel`
- `getSortedRowModel`
- `getExpandedRowModel`
- `getPaginationRowModel`
- `getRowModel`
- `getColumn`
- `getRow`

This keeps rendering fully user-owned while still giving consumers a coherent
headless API.

## State Model

State supports both modes:

- uncontrolled: the internal store owns state
- controlled: `options.state` is merged over internal state and
  `onStateChange` receives updates

Phase 1 state includes:

- `columnVisibility`
- `sorting`
- `pagination`
- `rowSelection`
- `columnFilters`
- `columnSizing`
- `columnOrder`
- `columnPinning`
- `expanded`
- `globalFilter`
- `grouping`

Feature-specific callbacks such as `onSortingChange` and
`onPaginationChange` improve controlled-state DX. `onStateChange` remains a
whole-table escape hatch.

Consumers can persist state with `getSerializableState(keys)` and restore it
with `hydrateState(partial)`. These APIs intentionally operate on plain table
state rather than browser storage so the core remains framework- and runtime-
agnostic.

## Row Model Pipeline

The row model is computed from:

- immutable `data`
- normalized columns
- visible columns
- `getRowId`

The original data array and row objects are never mutated. Accessed cell values
are cached per row so repeated render reads do not repeatedly execute accessors.

Feature row models compose as pipeline stages:

```txt
core rows -> filtered rows -> sorted rows -> expanded rows -> paginated rows
```

Each stage is independently memoized. Manual/server-side modes such as
`manualPagination` skip the matching client-side transform.

Core rows are not rebuilt when column visibility changes. The core row model is
based on immutable data, all columns, and row identity. Visible cells are derived
through the table instance so visibility changes do not invalidate raw row
identity or cached accessor values.

## Feature System

Features are plain objects that can:

- provide default options
- extend initial state
- attach behavior to the table instance

This avoids a growing central table class and lets advanced behavior land as
independent modules.

Current feature modules:

- column visibility
- column sizing
- column ordering
- column pinning
- expanding
- grouping state scaffold
- sorting
- filtering
- pagination
- row selection

Built-in features are resolved in `core/features.ts`, then user-provided
features are appended and deduped by feature name. This keeps feature
registration explicit while preventing accidental double registration as the
plugin surface grows.

Example future features:

- grouping and aggregation row models
- measured virtualization
- keyboard navigation
- column drag interaction helpers

## Performance Rules

- Preserve table instance identity in adapters.
- Memoize derived columns, visible columns, visible cells, and row models.
- Cache hot-path lookup structures such as visible column ID sets rather than
  allocating them per row render.
- Use narrow row-model dependencies such as `sorting`, `columnFilters`, and
  `pagination` instead of invalidating every stage on unrelated state changes.
- Treat user data as immutable input.
- Do not put rendering logic in the core.
- Prefer feature-local recomputation over invalidating the entire table.
- Keep state updates explicit and subscribable.
- Use `subscribeToState` or the React `useTableState` selector hook when a UI
  only needs one state slice.

## Virtualization Boundary

The core exposes `getVirtualItems`, a small offset calculator for row windows.
It does not observe DOM nodes or measure elements. React exposes `useVirtualRows`
as a compatibility hook over the current row model. This keeps the package
lightweight while making large-list rendering straightforward for consumers who
want to bring their own scroller or integrate a dedicated virtualizer.

## Debugging Boundary

`debug` is an opt-in runtime aid. State logging and debug snapshots live on the
table instance, while warnings for invalid operations are lightweight and can be
disabled with `debug: false`. Debug output must never be required for normal
control flow.

## API Direction

Primary API:

```tsx
const table = useTable({
  data,
  columns
});
```

The table object exposes enough structure to render any UI, but no UI is
prescribed by the library.
