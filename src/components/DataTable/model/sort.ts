// Sorting. Pure functions; no React.
import { compareValues, isEmpty } from "./compare.js";
import type { DataTableColumn, SortDirection, SortState } from "./types.js";

/** The value of a cell: the column accessor, else `row[key]`. */
export function readCell<Row>(row: Row, column: DataTableColumn<Row>): unknown {
  if (column.accessor) return column.accessor(row);
  return (row as Record<string, unknown> | null | undefined)?.[column.key];
}

/**
 * The next state when the header of column `key` is activated: not sorted -> ascending -> descending -> not sorted.
 * Another column starts at ascending. An unknown or non-sortable column leaves the state as it is.
 */
export function nextSort<Row>(current: SortState | null, key: string, columns: readonly DataTableColumn<Row>[]): SortState | null {
  const column = columns.find((c) => c.key === key);
  if (!column || column.sortable !== true) return current;
  if (current === null || current.key !== key) return { key, direction: "asc" };
  return current.direction === "asc" ? { key, direction: "desc" } : null;
}

/**
 * The input indices of `rows` in sorted order, or `null` when the sort does not apply (no sort, an unknown or
 * non-sortable column): the input order stays. Stable: rows that compare equal keep their input order, also in
 * descending order. Empty cells (`null`, `undefined`) go last in both directions. The accessor runs once per row.
 */
export function sortOrder<Row>(rows: readonly Row[], columns: readonly DataTableColumn<Row>[], sort: SortState | null): Uint32Array | null {
  const column = sort === null ? undefined : columns.find((c) => c.key === sort.key);
  if (sort === null || !column || column.sortable !== true) return null;
  const sign = sort.direction === "asc" ? 1 : -1;
  const values = rows.map((row) => readCell(row, column));
  const naturalKeys = column.comparator === undefined ? asciiNaturalKeys(values) : null;
  const keys = naturalKeys ?? values;
  const compare = naturalKeys !== null ? compareKeys : (column.comparator ?? compareValues);
  const order = new Uint32Array(rows.length);
  for (let i = 0; i < order.length; i += 1) order[i] = i;
  order.sort((i, j) => {
    const a = keys[i];
    const b = keys[j];
    const aEmpty = isEmpty(a);
    const bEmpty = isEmpty(b);
    if (aEmpty || bEmpty) {
      if (aEmpty && bEmpty) return i - j;
      return aEmpty ? 1 : -1;
    }
    const result = compare(a, b) * sign;
    return result === 0 || Number.isNaN(result) ? i - j : result;
  });
  return order;
}

const compareKeys = (a: unknown, b: unknown): number => ((a as string) < (b as string) ? -1 : (a as string) > (b as string) ? 1 : 0);

/** The natural key of an ASCII string (see `asciiNaturalKeys`), or `null` when it has a non-ASCII character. */
function naturalKey(value: string): string | null {
  let out = "";
  const n = value.length;
  let i = 0;
  while (i < n) {
    const code = value.charCodeAt(i);
    if (code > 127) return null;
    if (code >= 48 && code <= 57) {
      let end = i;
      while (end < n) {
        const c = value.charCodeAt(end);
        if (c < 48 || c > 57) break;
        end += 1;
      }
      let start = i;
      while (start < end - 1 && value.charCodeAt(start) === 48) start += 1;
      out += `0${String.fromCharCode(0x100 + end - start)}${value.slice(start, end)}`;
      i = end;
    } else {
      out += code >= 65 && code <= 90 ? String.fromCharCode(code + 32) : value[i];
      i += 1;
    }
  }
  return out;
}

/**
 * Fast path of the default string order: when every non-empty value of a column is an ASCII string, each one is turned
 * once into a key that compares with `<` in the same order as the default collator (case-insensitive, digit runs by
 * number): lower case, and each digit run as `0`, a length character and the digits without leading zeros. This makes a
 * 50,000 row sort about twice as fast as comparing with the collator. Returns `null` (use `compareValues`) when a value
 * is not a string or has a non-ASCII character, where only the locale-aware collator orders accents correctly. The order
 * matches the collator for letters, digits and spaces; ASCII punctuation, symbols and control characters can order differently.
 */
export function asciiNaturalKeys(values: readonly unknown[]): (string | null | undefined)[] | null {
  const keys: (string | null | undefined)[] = new Array(values.length);
  let strings = 0;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (isEmpty(value)) {
      keys[i] = value;
      continue;
    }
    if (typeof value !== "string") return null;
    const key = naturalKey(value);
    if (key === null) return null;
    strings += 1;
    keys[i] = key;
  }
  return strings === 0 ? null : keys;
}

/** `items` (one per row, in input order) in the order of the sort; a copy, the input is not changed. */
export function applySortOrder<T>(items: readonly T[], order: Uint32Array | null): T[] {
  if (order === null) return items.slice();
  const sorted: T[] = new Array(order.length);
  for (let i = 0; i < order.length; i += 1) sorted[i] = items[order[i]!]!;
  return sorted;
}

/** Row ids in sorted order (see `sortOrder`). `ids[i]` is the id of `rows[i]`. */
export function sortRowIds<Row>(rows: readonly Row[], ids: readonly string[], columns: readonly DataTableColumn<Row>[], sort: SortState | null): string[] {
  return applySortOrder(ids, sortOrder(rows, columns, sort));
}

export type { SortDirection };
