// Types of the headless DataTable model. No React Native import: this folder runs in plain Node.

export type SortDirection = "asc" | "desc";

/** The active sort, or `null` for the input order. */
export interface SortState {
  key: string;
  direction: SortDirection;
}

export type ColumnAlign = "start" | "center" | "end";

/** One column. `accessor` reads the cell value from a row; without it the value is `row[key]`. */
export interface DataTableColumn<Row> {
  key: string;
  header: string;
  accessor?: (row: Row) => unknown;
  /** Whether the column can be sorted. Default `false`. */
  sortable?: boolean;
  /** Orders two cell values ascending (negative: `a` first). Default: `compareValues`. */
  comparator?: (a: unknown, b: unknown) => number;
  /** Width in pixels, or `"auto"`. */
  width?: number | "auto";
  /** Default `"start"`. */
  align?: ColumnAlign;
  /** Columns with a lower number are kept longer when the table collapses columns. */
  priority?: number;
}

export type SelectionMode = "none" | "single" | "multi";

/** The selected row ids, in the order they were selected. */
export type Selection = readonly string[];

export type SelectionAction =
  | { type: "toggle"; id: string }
  | { type: "select"; id: string }
  | { type: "deselect"; id: string }
  | { type: "selectAll"; ids: readonly string[] }
  | { type: "clear" };
