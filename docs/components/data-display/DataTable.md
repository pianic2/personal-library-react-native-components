# DataTable

**Stability:** experimental. Only the headless model exists so far; it is not exported from the package root (the wiring tickets own that).

The model behind a data table: column definitions, sorting and selection, with no rendering. The same sorted row ids drive a table, a list or a card layout, and the logic runs in plain Node (the model files import no React Native module), so it is unit-testable and benchmarkable.

## Import

```ts
import { useDataTable } from "./components/DataTable/index.js";
import type { DataTableColumn, SortState, Selection } from "./components/DataTable/index.js";
```

## Props

`useDataTable(options)` takes:

```ts
interface UseDataTableOptions<Row> {
  rows: readonly Row[];
  columns: readonly DataTableColumn<Row>[];
  getRowId?: (row: Row, index: number) => string; // unique; default: row.id (string or number), else the index
  sort?: SortState | null;                        // controlled; null is a controlled "not sorted"
  defaultSort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  selectionMode?: "none" | "single" | "multi";    // default "none"
  selection?: readonly string[];                  // controlled
  defaultSelection?: readonly string[];
  onSelectionChange?: (selection: readonly string[]) => void;
}

interface DataTableColumn<Row> {
  key: string;
  header: string;
  accessor?: (row: Row) => unknown;               // default: row[key]
  sortable?: boolean;                             // default false
  comparator?: (a: unknown, b: unknown) => number; // ascending order of two non-empty values
  width?: number | "auto";
  align?: "start" | "center" | "end";
  priority?: number;                              // lower is kept longer when columns collapse
}

interface SortState {
  key: string;
  direction: "asc" | "desc";
}
```

It returns `rows` and `rowIds` in display order, `sort`, `toggleSort(key)`, `setSort(sort)`, `selection`, `isSelected(id)`, `toggleRow(id)`, `selectRow(id)`, `deselectRow(id)`, `selectAll()`, `toggleAll()`, `clearSelection()`, `allSelected` and `someSelected` (the indeterminate header state).

It also returns `selectionMode`. The pure functions are exported too: `sortOrder`, `applySortOrder`, `sortRowIds`, `nextSort`, `readCell`, `compareValues`, `isEmpty`, `selectionReducer`, `normalizeSelection`, `pruneSelection`, `collectRowIds` and `defaultGetRowId`.

## Usage

```tsx
const columns: DataTableColumn<Person>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "age", header: "Age", sortable: true, align: "end" },
];

function PeopleTable({ people }: { people: Person[] }) {
  const table = useDataTable({ rows: people, columns, selectionMode: "multi" });
  return (
    <View>
      {columns.map((column) => (
        <Pressable key={column.key} accessibilityRole="button" accessibilityLabel={`Sort by ${column.header}`} onPress={() => table.toggleSort(column.key)}>
          <Text>{column.header}</Text>
        </Pressable>
      ))}
      {table.rows.map((row) => (
        <Pressable key={row.id} accessibilityRole="checkbox" accessibilityState={{ checked: table.isSelected(row.id) }} onPress={() => table.toggleRow(row.id)}>
          <Text>{row.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}
```

## Behaviour

- **Sort cycle:** activating a sortable header goes ascending, descending, none; another column starts at ascending. An unknown or non-sortable column changes nothing.
- **Stable:** rows that compare equal keep their input order, in both directions. Empty cells (`null`, `undefined`) go last in both directions and never reach a comparator.
- **Default order:** numbers and bigints numerically (`NaN` last), booleans `false` before `true`, dates by time, strings case-insensitively with digit runs by number (`item 2` before `item 10`). Values of different kinds are ordered by kind. ASCII-only string columns use a precomputed key (about twice as fast as the collator) that orders like the collator for letters, digits and spaces; ASCII punctuation, symbols and control characters can order differently. Strings with accents use the locale collator, so `è` sorts next to `e`. Pass a `comparator` for any other rule.
- **Memoized:** `rows` and `rowIds` keep their identity while `rows`, `columns`, the sort and `getRowId` are the same, also when only the selection changes. Keep `columns` and `getRowId` stable (module level or `useMemo`): a new function or array on every render makes `rowIds` and `rows` new arrays on every render.
- **Performance:** sorting 50,000 rows takes about 25 ms for numbers and about 70 ms for ASCII strings on a development machine (the test asserts under 150 ms).
- **Selection:** `none` selects nothing; `single` keeps the last row selected and ignores `selectAll`; `multi` keeps ids in selection order. A `defaultSelection` is normalized for the mode. An uncontrolled selection drops the ids of rows that are gone. `selectAll` follows the display order. Several calls in one tick (`ids.forEach(selectRow)`, two `toggleSort` calls) build on each other when the value is uncontrolled; with a controlled value each call is relative to the value the parent last passed.
- **Row ids:** a duplicate id throws a `RangeError`.
- **Controlled:** `sort` and `selection` follow the props; the model reports changes through `onSortChange` and `onSelectionChange` and does not change them itself.

## Stability

Experimental (prototype). The view components (virtualized rows, sticky header, responsive cards) are separate tickets and will extend this folder.
