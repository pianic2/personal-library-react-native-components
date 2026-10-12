// The headless model of a data table: sorted row ids, sort state and selection. React is the only import.
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { normalizeSelection, pruneSelection, selectionReducer } from "./selection.js";
import { applySortOrder, nextSort, sortOrder } from "./sort.js";
import type { DataTableColumn, Selection, SelectionAction, SelectionMode, SortState } from "./types.js";

export interface UseDataTableOptions<Row> {
  rows: readonly Row[];
  columns: readonly DataTableColumn<Row>[];
  /** The id of a row; ids must be unique. Default: `row.id` when it is a string or a number, else the row index. */
  getRowId?: (row: Row, index: number) => string;
  /** Controlled sort. `null` means "not sorted"; leave it `undefined` for an uncontrolled sort. */
  sort?: SortState | null;
  defaultSort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  /** Default `"none"`. */
  selectionMode?: SelectionMode;
  /** Controlled selection; leave it `undefined` for an uncontrolled selection. */
  selection?: Selection;
  defaultSelection?: Selection;
  onSelectionChange?: (selection: Selection) => void;
}

export interface DataTableModel<Row> {
  /** The rows in display order. The same array while rows, columns, sort and `getRowId` are the same. */
  rows: readonly Row[];
  /** The ids of `rows`, in the same order. The same array while `rows` is the same. */
  rowIds: readonly string[];
  sort: SortState | null;
  /** Moves the sort of column `key` to the next step: ascending, descending, none. */
  toggleSort(key: string): void;
  setSort(sort: SortState | null): void;
  selectionMode: SelectionMode;
  selection: Selection;
  isSelected(id: string): boolean;
  toggleRow(id: string): void;
  selectRow(id: string): void;
  deselectRow(id: string): void;
  selectAll(): void;
  /** Selects every row, or clears the selection when every row is already selected. */
  toggleAll(): void;
  clearSelection(): void;
  allSelected: boolean;
  /** Some but not all rows are selected (the "indeterminate" state of a header checkbox). */
  someSelected: boolean;
}

export const defaultGetRowId = (row: unknown, index: number): string => {
  const id = (row as { id?: unknown } | null | undefined)?.id;
  return typeof id === "string" || typeof id === "number" ? String(id) : String(index);
};

/** The ids of `rows`; throws a `RangeError` for a duplicate id. */
export function collectRowIds<Row>(rows: readonly Row[], getRowId: (row: Row, index: number) => string): string[] {
  const seen = new Set<string>();
  const ids: string[] = new Array(rows.length);
  for (let i = 0; i < rows.length; i += 1) {
    const id = getRowId(rows[i]!, i);
    if (seen.has(id)) throw new RangeError(`useDataTable: duplicate row id "${id}"`);
    seen.add(id);
    ids[i] = id;
  }
  return ids;
}

const NO_SELECTION: Selection = [];

export function useDataTable<Row>(options: UseDataTableOptions<Row>): DataTableModel<Row> {
  const { rows, columns, getRowId = defaultGetRowId, selectionMode = "none" } = options;

  const [sortState, setSortState] = useState<SortState | null>(options.defaultSort ?? null);
  const sortControlled = options.sort !== undefined;
  const sort = sortControlled ? (options.sort as SortState | null) : sortState;

  const [selectionState, setSelectionState] = useState<Selection>(options.defaultSelection ?? NO_SELECTION);
  const selectionControlled = options.selection !== undefined;

  const ids = useMemo(() => collectRowIds(rows, getRowId), [rows, getRowId]);
  const order = useMemo(() => sortOrder(rows, columns, sort), [rows, columns, sort]);
  const sortedRows = useMemo(() => applySortOrder(rows, order), [rows, order]);
  const sortedIds = useMemo(() => applySortOrder(ids, order), [ids, order]);
  const idSet = useMemo(() => new Set(ids), [ids]);

  // The selection a mode allows. An uncontrolled one never keeps the id of a row that is gone; a controlled one is the
  // caller's to keep.
  const normalized = useMemo(() => normalizeSelection(selectionControlled ? (options.selection as Selection) : selectionState, selectionMode), [selectionControlled, options.selection, selectionState, selectionMode]);
  const selection = useMemo(() => (selectionControlled ? normalized : pruneSelection(normalized, idSet)), [selectionControlled, normalized, idSet]);
  const selected = useMemo(() => new Set(selection), [selection]);

  // Handlers read the current values through refs, so their identity is stable. The refs are refreshed after every commit,
  // and an uncontrolled change is written to its ref at once, so several calls in one tick build on each other
  // (`ids.forEach(selectRow)`, two `toggleSort` calls). A controlled value only changes when the parent passes a new one,
  // so calls in one tick are each relative to the value the parent last passed.
  const latest = useRef({ options, columns, sortedIds, selectionMode, sortControlled, selectionControlled });
  const sortRef = useRef<SortState | null>(sort);
  const selectionRef = useRef<Selection>(selection);
  useLayoutEffect(() => {
    latest.current = { options, columns, sortedIds, selectionMode, sortControlled, selectionControlled };
    sortRef.current = sort;
    selectionRef.current = selection;
  });

  const setSort = useCallback((next: SortState | null) => {
    const l = latest.current;
    if (!l.sortControlled) {
      sortRef.current = next;
      setSortState(next);
    }
    l.options.onSortChange?.(next);
  }, []);

  const toggleSort = useCallback(
    (key: string) => {
      const next = nextSort(sortRef.current, key, latest.current.columns as readonly DataTableColumn<unknown>[]);
      if (next !== sortRef.current) setSort(next);
    },
    [setSort],
  );

  const dispatch = useCallback((action: SelectionAction) => {
    const l = latest.current;
    const next = selectionReducer(selectionRef.current, action, l.selectionMode);
    if (next === selectionRef.current) return;
    if (!l.selectionControlled) {
      selectionRef.current = next;
      setSelectionState(next);
    }
    l.options.onSelectionChange?.(next);
  }, []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);
  const toggleRow = useCallback((id: string) => dispatch({ type: "toggle", id }), [dispatch]);
  const selectRow = useCallback((id: string) => dispatch({ type: "select", id }), [dispatch]);
  const deselectRow = useCallback((id: string) => dispatch({ type: "deselect", id }), [dispatch]);
  const clearSelection = useCallback(() => dispatch({ type: "clear" }), [dispatch]);
  const selectAll = useCallback(() => dispatch({ type: "selectAll", ids: latest.current.sortedIds }), [dispatch]);

  const total = sortedIds.length;
  let count = 0;
  for (const id of sortedIds) if (selected.has(id)) count += 1;
  const allSelected = total > 0 && count === total;
  const someSelected = count > 0 && count < total;

  const toggleAll = useCallback(() => {
    const rowIds = latest.current.sortedIds;
    const current = new Set(selectionRef.current);
    const everySelected = rowIds.length > 0 && rowIds.every((id) => current.has(id));
    dispatch(everySelected ? { type: "clear" } : { type: "selectAll", ids: rowIds });
  }, [dispatch]);

  return {
    rows: sortedRows,
    rowIds: sortedIds,
    sort,
    toggleSort,
    setSort,
    selectionMode,
    selection,
    isSelected,
    toggleRow,
    selectRow,
    deselectRow,
    selectAll,
    toggleAll,
    clearSelection,
    allSelected,
    someSelected,
  };
}
