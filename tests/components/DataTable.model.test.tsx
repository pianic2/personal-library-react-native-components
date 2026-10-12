import React from "react";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import TestRenderer, { act } from "react-test-renderer";
import { Pressable, Text, View } from "react-native";
import { ThemeProvider, useTheme } from "../../src";
import {
  applySortOrder,
  collectRowIds,
  normalizeSelection,
  compareValues,
  defaultGetRowId,
  nextSort,
  pruneSelection,
  readCell,
  selectionReducer,
  sortOrder,
  sortRowIds,
  useDataTable,
  type DataTableColumn,
  type DataTableModel,
  type Selection,
  type SortState,
  type UseDataTableOptions,
} from "../../src/components/DataTable/model/index.js";
import { asciiNaturalKeys, asciiNaturalKeys as asciiNaturalKeysDirect } from "../../src/components/DataTable/model/sort.js";
import { darkColors, lightColors } from "../../src/tokens/colors.base.js";

interface Person {
  id: string;
  name: string | null | undefined;
  age: number | null;
}

const columns: DataTableColumn<Person>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "age", header: "Age", sortable: true, align: "end", priority: 1 },
  { key: "plain", header: "Plain", accessor: (p) => p.id },
];

const people: Person[] = [
  { id: "a", name: "Carla", age: 30 },
  { id: "b", name: "anna", age: 25 },
  { id: "c", name: "Bruno", age: 30 },
  { id: "d", name: null, age: 41 },
  { id: "e", name: "Dora", age: null },
];

const ids = (rows: readonly Person[]) => rows.map((p) => p.id);

describe("PLRNUI-211 compareValues", () => {
  it("orders numbers, bigints, strings, booleans and dates", () => {
    assert.ok(compareValues(1, 2) < 0 && compareValues(2, 1) > 0 && compareValues(2, 2) === 0);
    assert.ok(compareValues(1n, 2n) < 0 && compareValues(2n, 1) > 0 && compareValues(1n, 1n) === 0);
    assert.ok(compareValues("a", "B") < 0 && compareValues("b", "A") > 0 && compareValues("a", "A") === 0);
    assert.ok(compareValues("item 2", "item 10") < 0, "numeric collation");
    assert.ok(compareValues(false, true) < 0 && compareValues(true, true) === 0);
    assert.ok(compareValues(new Date(1), new Date(2)) < 0 && compareValues(new Date(2), new Date(2)) === 0);
  });

  it("puts NaN last among numbers and invalid dates last among dates", () => {
    assert.ok(compareValues(Number.NaN, 1) > 0 && compareValues(1, Number.NaN) < 0 && compareValues(Number.NaN, Number.NaN) === 0);
    const bad = new Date("nope");
    assert.ok(compareValues(bad, new Date(0)) > 0 && compareValues(new Date(0), bad) < 0 && compareValues(bad, new Date("x")) === 0);
  });

  it("orders values of different kinds by kind, and other objects as equal", () => {
    assert.ok(compareValues(5, "a") < 0 && compareValues("a", true) < 0 && compareValues(true, new Date(0)) < 0 && compareValues(new Date(0), {}) < 0);
    assert.equal(compareValues({}, []), 0);
  });
});

describe("PLRNUI-211 sorting", () => {
  it("readCell uses the accessor, else the key, and tolerates a missing row", () => {
    assert.equal(readCell(people[0]!, columns[2]!), "a");
    assert.equal(readCell(people[0]!, columns[0]!), "Carla");
    assert.equal(readCell(null as unknown as Person, columns[0]!), undefined);
  });

  it("nextSort cycles ascending, descending, none and restarts on another column", () => {
    const asc = nextSort<Person>(null, "name", columns);
    assert.deepEqual(asc, { key: "name", direction: "asc" });
    const desc = nextSort(asc, "name", columns);
    assert.deepEqual(desc, { key: "name", direction: "desc" });
    assert.equal(nextSort(desc, "name", columns), null);
    assert.deepEqual(nextSort(desc, "age", columns), { key: "age", direction: "asc" });
  });

  it("nextSort leaves the state for an unknown or non-sortable column", () => {
    const current: SortState = { key: "age", direction: "desc" };
    assert.ok(nextSort(current, "missing", columns) === current);
    assert.ok(nextSort(current, "plain", columns) === current);
    assert.equal(nextSort<Person>(null, "plain", columns), null);
  });

  it("sorts ascending and descending, with empty cells last in both", () => {
    const rowIds = people.map((p) => p.id);
    assert.deepEqual(sortRowIds(people, rowIds, columns, { key: "name", direction: "asc" }), ["b", "c", "a", "e", "d"]);
    assert.deepEqual(sortRowIds(people, rowIds, columns, { key: "name", direction: "desc" }), ["e", "a", "c", "b", "d"]);
    assert.deepEqual(sortRowIds(people, rowIds, columns, { key: "age", direction: "asc" }), ["b", "a", "c", "d", "e"]);
    assert.deepEqual(sortRowIds(people, rowIds, columns, { key: "age", direction: "desc" }), ["d", "a", "c", "b", "e"]);
  });

  it("is stable: ties keep the input order, ascending and descending", () => {
    // a and c are both 30
    const asc = sortRowIds(people, ids(people), columns, { key: "age", direction: "asc" });
    assert.ok(asc.indexOf("a") < asc.indexOf("c"));
    const desc = sortRowIds(people, ids(people), columns, { key: "age", direction: "desc" });
    assert.ok(desc.indexOf("a") < desc.indexOf("c"));
    const rows = Array.from({ length: 200 }, (_, i) => ({ id: String(i), k: i % 3 }));
    const cols: DataTableColumn<(typeof rows)[number]>[] = [{ key: "k", header: "k", sortable: true }];
    for (const direction of ["asc", "desc"] as const) {
      const sorted = sortRowIds(rows, rows.map((r) => r.id), cols, { key: "k", direction });
      for (let i = 1; i < sorted.length; i += 1) {
        const prev = rows[Number(sorted[i - 1])]!;
        const cur = rows[Number(sorted[i])]!;
        assert.ok(prev.k !== cur.k || Number(sorted[i - 1]) < Number(sorted[i]), `${direction} ${i}`);
      }
    }
  });

  it("returns the input order for no sort, an unknown column or a non-sortable column, as a copy", () => {
    const rowIds = ids(people);
    for (const sort of [null, { key: "missing", direction: "asc" as const }, { key: "plain", direction: "asc" as const }]) {
      const result = sortRowIds(people, rowIds, columns, sort);
      assert.deepEqual(result, rowIds);
      assert.notEqual(result, rowIds);
    }
    assert.equal(sortOrder(people, columns, null), null);
    assert.deepEqual(applySortOrder([1, 2], null), [1, 2]);
  });

  it("does not change its input", () => {
    const copy = JSON.stringify(people);
    sortRowIds(people, ids(people), columns, { key: "name", direction: "asc" });
    assert.equal(JSON.stringify(people), copy);
  });

  it("uses a custom comparator, which sees the cell values", () => {
    const seen: unknown[] = [];
    const cols: DataTableColumn<Person>[] = [{ key: "age", header: "Age", sortable: true, comparator: (a, b) => { seen.push(a); return (b as number) - (a as number); } }];
    const sorted = sortRowIds(people, ids(people), cols, { key: "age", direction: "asc" });
    assert.deepEqual(sorted.slice(0, 3), ["d", "a", "c"]);
    assert.ok(seen.every((v) => typeof v === "number"), "empty cells never reach the comparator");
  });

  it("a comparator that returns NaN or 0 keeps the input order", () => {
    for (const comparator of [() => Number.NaN, () => 0]) {
      const cols: DataTableColumn<Person>[] = [{ key: "age", header: "Age", sortable: true, comparator }];
      assert.deepEqual(sortRowIds(people, ids(people), cols, { key: "age", direction: "asc" }), ["a", "b", "c", "d", "e"]);
    }
  });

  it("reads each cell once per row", () => {
    let reads = 0;
    const cols: DataTableColumn<Person>[] = [{ key: "age", header: "Age", sortable: true, accessor: (p) => { reads += 1; return p.age; } }];
    sortOrder(people, cols, { key: "age", direction: "asc" });
    assert.equal(reads, people.length);
  });

  it("sorts strings by the fast path in the same order as the default collator", () => {
    let seed = 11;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const alphabet = "abcXYZ019 ";
    const rows = Array.from({ length: 600 }, (_, i) => ({
      id: String(i),
      s: rnd() < 0.05 ? null : Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => alphabet[Math.floor(rnd() * alphabet.length)]).join(""),
    }));
    const fast: DataTableColumn<(typeof rows)[number]>[] = [{ key: "s", header: "s", sortable: true }];
    const generic: DataTableColumn<(typeof rows)[number]>[] = [{ key: "s", header: "s", sortable: true, comparator: compareValues }];
    for (const direction of ["asc", "desc"] as const) {
      assert.deepEqual(
        Array.from(sortOrder(rows, fast, { key: "s", direction })!),
        Array.from(sortOrder(rows, generic, { key: "s", direction })!),
        direction,
      );
    }
  });

  it("the fast path orders digit runs by number and ignores case", () => {
    const rows = ["Item 10", "item 9", "ITEM 100", "item 09", "item 1"].map((s, i) => ({ id: String(i), s }));
    const cols: DataTableColumn<(typeof rows)[number]>[] = [{ key: "s", header: "s", sortable: true }];
    const sorted = sortRowIds(rows, rows.map((r) => r.id), cols, { key: "s", direction: "asc" }).map((id) => rows[Number(id)]!.s);
    assert.deepEqual(sorted, ["item 1", "item 9", "item 09", "Item 10", "ITEM 100"]);
  });

  it("falls back to the collator for non-ASCII strings, and for mixed kinds, so accents sort next to their letter", () => {
    const rows = ["zebra", "èra", "esame", "Uva"].map((s, i) => ({ id: String(i), s }));
    const cols: DataTableColumn<(typeof rows)[number]>[] = [{ key: "s", header: "s", sortable: true }];
    const sorted = sortRowIds(rows, rows.map((r) => r.id), cols, { key: "s", direction: "asc" }).map((id) => rows[Number(id)]!.s);
    assert.deepEqual(sorted, ["èra", "esame", "Uva", "zebra"]);
    assert.equal(asciiNaturalKeys(["a", 1]), null);
    assert.equal(asciiNaturalKeysDirect([null, undefined]), null);
    assert.deepEqual(asciiNaturalKeys(["B", null, "a"]), ["b", null, "a"]);
  });
});

describe("PLRNUI-211 selection reducer", () => {
  const sel = (...a: string[]): Selection => a;

  it("none mode selects nothing and clears what is there", () => {
    const empty = sel();
    assert.ok(selectionReducer(empty, { type: "select", id: "a" }, "none") === empty);
    assert.deepEqual(selectionReducer(sel("a"), { type: "toggle", id: "b" }, "none"), []);
  });

  it("clear empties the selection, and keeps the empty array it was given", () => {
    const empty = sel();
    assert.ok(selectionReducer(empty, { type: "clear" }, "multi") === empty);
    assert.deepEqual(selectionReducer(sel("a", "b"), { type: "clear" }, "multi"), []);
  });

  it("select in multi mode appends once; in single mode replaces", () => {
    assert.deepEqual(selectionReducer(sel("a"), { type: "select", id: "b" }, "multi"), ["a", "b"]);
    const already = sel("a");
    assert.ok(selectionReducer(already, { type: "select", id: "a" }, "multi") === already);
    assert.deepEqual(selectionReducer(sel("a"), { type: "select", id: "b" }, "single"), ["b"]);
    assert.ok(selectionReducer(already, { type: "select", id: "a" }, "single") === already);
    assert.deepEqual(selectionReducer(sel(), { type: "select", id: "a" }, "single"), ["a"]);
  });

  it("deselect removes an id, or keeps the same array when it is not selected", () => {
    assert.deepEqual(selectionReducer(sel("a", "b"), { type: "deselect", id: "a" }, "multi"), ["b"]);
    const state = sel("a");
    assert.ok(selectionReducer(state, { type: "deselect", id: "z" }, "multi") === state);
  });

  it("toggle adds or removes; in single mode it replaces the other id", () => {
    assert.deepEqual(selectionReducer(sel("a"), { type: "toggle", id: "b" }, "multi"), ["a", "b"]);
    assert.deepEqual(selectionReducer(sel("a", "b"), { type: "toggle", id: "a" }, "multi"), ["b"]);
    assert.deepEqual(selectionReducer(sel("a"), { type: "toggle", id: "b" }, "single"), ["b"]);
    assert.deepEqual(selectionReducer(sel("a"), { type: "toggle", id: "a" }, "single"), []);
  });

  it("selectAll adds the missing ids in multi mode, changes nothing when all are in, and is ignored in single mode", () => {
    assert.deepEqual(selectionReducer(sel("b"), { type: "selectAll", ids: ["a", "b", "c"] }, "multi"), ["b", "a", "c"]);
    const all = sel("a", "b");
    assert.ok(selectionReducer(all, { type: "selectAll", ids: ["a", "b"] }, "multi") === all);
    const one = sel("a");
    assert.ok(selectionReducer(one, { type: "selectAll", ids: ["a", "b"] }, "single") === one);
  });

  it("normalizeSelection applies the mode: nothing, the last id, or the ids without duplicates", () => {
    assert.deepEqual(normalizeSelection(sel("a", "b"), "none"), []);
    const empty = sel();
    assert.ok(normalizeSelection(empty, "none") === empty);
    assert.deepEqual(normalizeSelection(sel("a", "b", "c"), "single"), ["c"]);
    const one = sel("a");
    assert.ok(normalizeSelection(one, "single") === one && normalizeSelection(empty, "single") === empty);
    assert.deepEqual(normalizeSelection(sel("a", "b", "a"), "multi"), ["a", "b"]);
    const unique = sel("a", "b");
    assert.ok(normalizeSelection(unique, "multi") === unique);
  });

  it("pruneSelection drops ids that are gone and keeps the array when none is", () => {
    const state = sel("a", "b", "c");
    assert.deepEqual(pruneSelection(state, new Set(["a", "c"])), ["a", "c"]);
    assert.ok(pruneSelection(state, new Set(["a", "b", "c", "d"])) === state);
  });
});

describe("PLRNUI-211 row ids", () => {
  it("defaultGetRowId uses a string or number id, else the index", () => {
    assert.equal(defaultGetRowId({ id: "x" }, 3), "x");
    assert.equal(defaultGetRowId({ id: 7 }, 3), "7");
    assert.equal(defaultGetRowId({ id: {} }, 3), "3");
    assert.equal(defaultGetRowId(null, 4), "4");
  });

  it("collectRowIds throws a RangeError for a duplicate id", () => {
    assert.deepEqual(collectRowIds(people, (p) => p.id), ["a", "b", "c", "d", "e"]);
    assert.throws(() => collectRowIds([{ id: "x" }, { id: "x" }], (r) => r.id), RangeError);
  });
});

function mount(initial: UseDataTableOptions<Person>) {
  const seen: { model?: DataTableModel<Person>; renders: number } = { renders: 0 };
  function Probe({ options }: { options: UseDataTableOptions<Person> }) {
    seen.model = useDataTable(options);
    seen.renders += 1;
    return null;
  }
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<Probe options={initial} />);
  });
  return {
    seen,
    get model() { return seen.model!; },
    update: (options: UseDataTableOptions<Person>) => act(() => renderer.update(<Probe options={options} />)),
  };
}

const getRowId = (p: Person) => p.id;

describe("PLRNUI-211 useDataTable", () => {
  it("returns the rows in input order with no sort", () => {
    const m = mount({ rows: people, columns, getRowId });
    assert.deepEqual(m.model.rowIds, ["a", "b", "c", "d", "e"]);
    assert.deepEqual(ids(m.model.rows), ["a", "b", "c", "d", "e"]);
    assert.equal(m.model.sort, null);
    assert.equal(m.model.selectionMode, "none");
  });

  it("toggleSort walks the cycle and sorts the rows and the ids together", () => {
    const m = mount({ rows: people, columns, getRowId });
    act(() => m.model.toggleSort("name"));
    assert.deepEqual(m.model.sort, { key: "name", direction: "asc" });
    assert.deepEqual(m.model.rowIds, ["b", "c", "a", "e", "d"]);
    assert.deepEqual(ids(m.model.rows), ["b", "c", "a", "e", "d"]);
    act(() => m.model.toggleSort("name"));
    assert.deepEqual(m.model.rowIds, ["e", "a", "c", "b", "d"]);
    act(() => m.model.toggleSort("name"));
    assert.equal(m.model.sort, null);
    assert.deepEqual(m.model.rowIds, ["a", "b", "c", "d", "e"]);
    act(() => m.model.toggleSort("plain")); // not sortable: nothing happens
    assert.equal(m.model.sort, null);
  });

  it("memoizes: the same inputs give the same arrays, also when only the selection changes", () => {
    const options = { rows: people, columns, getRowId, selectionMode: "multi" as const, defaultSort: { key: "age", direction: "asc" as const } };
    const m = mount(options);
    const rows = m.model.rows;
    const rowIds = m.model.rowIds;
    m.update({ ...options });
    assert.ok(m.model.rows === rows && m.model.rowIds === rowIds, "re-render with equal inputs");
    act(() => m.model.toggleRow("a"));
    assert.ok(m.model.rows === rows && m.model.rowIds === rowIds, "selection change");
    act(() => m.model.toggleSort("age"));
    assert.ok(m.model.rows !== rows, "a new sort gives a new array");
  });

  it("is stable: ties keep the input order through the hook", () => {
    const m = mount({ rows: people, columns, getRowId, defaultSort: { key: "age", direction: "desc" } });
    const order = m.model.rowIds;
    assert.ok(order.indexOf("a") < order.indexOf("c"));
  });

  it("a controlled sort follows the prop and reports changes without changing itself", () => {
    const changes: (SortState | null)[] = [];
    const options = { rows: people, columns, getRowId, sort: { key: "age", direction: "asc" } as SortState | null, onSortChange: (s: SortState | null) => changes.push(s) };
    const m = mount(options);
    assert.deepEqual(m.model.rowIds.slice(0, 2), ["b", "a"]);
    act(() => m.model.toggleSort("age"));
    assert.deepEqual(changes, [{ key: "age", direction: "desc" }]);
    assert.deepEqual(m.model.sort, { key: "age", direction: "asc" }, "unchanged until the parent updates");
    m.update({ ...options, sort: null });
    assert.equal(m.model.sort, null, "null is a controlled 'not sorted'");
    act(() => m.model.setSort({ key: "name", direction: "asc" }));
    assert.equal(changes.length, 2);
  });

  it("an uncontrolled sort also notifies onSortChange", () => {
    const changes: (SortState | null)[] = [];
    const m = mount({ rows: people, columns, getRowId, onSortChange: (s) => changes.push(s) });
    act(() => m.model.toggleSort("age"));
    assert.deepEqual(changes, [{ key: "age", direction: "asc" }]);
  });

  it("multi selection: toggle, select, deselect, selectAll, toggleAll, clear and the header states", () => {
    const m = mount({ rows: people, columns, getRowId, selectionMode: "multi" });
    assert.equal(m.model.allSelected, false);
    assert.equal(m.model.someSelected, false);
    act(() => m.model.toggleRow("a"));
    assert.deepEqual(m.model.selection, ["a"]);
    assert.ok(m.model.isSelected("a") && !m.model.isSelected("b"));
    assert.equal(m.model.someSelected, true);
    act(() => m.model.selectRow("b"));
    act(() => m.model.deselectRow("a"));
    assert.deepEqual(m.model.selection, ["b"]);
    act(() => m.model.selectAll());
    assert.equal(m.model.allSelected, true);
    assert.equal(m.model.someSelected, false);
    act(() => m.model.toggleAll());
    assert.deepEqual(m.model.selection, []);
    act(() => m.model.toggleAll());
    assert.equal(m.model.allSelected, true);
    act(() => m.model.clearSelection());
    assert.deepEqual(m.model.selection, []);
  });

  it("selectAll follows the display order", () => {
    const m = mount({ rows: people, columns, getRowId, selectionMode: "multi", defaultSort: { key: "name", direction: "asc" } });
    act(() => m.model.selectAll());
    assert.deepEqual(m.model.selection, ["b", "c", "a", "e", "d"]);
  });

  it("single selection keeps one row, and selectAll does nothing", () => {
    const m = mount({ rows: people, columns, getRowId, selectionMode: "single" });
    act(() => m.model.toggleRow("a"));
    act(() => m.model.toggleRow("b"));
    assert.deepEqual(m.model.selection, ["b"]);
    act(() => m.model.selectAll());
    assert.deepEqual(m.model.selection, ["b"]);
    act(() => m.model.toggleAll());
    assert.deepEqual(m.model.selection, ["b"], "toggleAll cannot select several rows in single mode");
  });

  it("none mode ignores selection actions", () => {
    const m = mount({ rows: people, columns, getRowId, defaultSelection: ["a"] });
    act(() => m.model.toggleRow("b"));
    assert.deepEqual(m.model.selection, []);
  });

  it("a controlled selection follows the prop and reports changes", () => {
    const changes: Selection[] = [];
    const options = { rows: people, columns, getRowId, selectionMode: "multi" as const, selection: ["a"] as Selection, onSelectionChange: (s: Selection) => changes.push(s) };
    const m = mount(options);
    act(() => m.model.toggleRow("b"));
    assert.deepEqual(changes, [["a", "b"]]);
    assert.deepEqual(m.model.selection, ["a"]);
    m.update({ ...options, selection: ["a", "b"] });
    assert.ok(m.model.isSelected("b"));
    act(() => m.model.toggleRow("zzz-unknown"));
    assert.equal(changes.length, 2);
  });

  it("an action that changes nothing does not notify", () => {
    const changes: Selection[] = [];
    const m = mount({ rows: people, columns, getRowId, selectionMode: "multi", onSelectionChange: (s) => changes.push(s) });
    act(() => m.model.clearSelection());
    act(() => m.model.deselectRow("a"));
    assert.deepEqual(changes, []);
  });

  it("an uncontrolled selection drops the ids of rows that are gone", () => {
    const options = { rows: people, columns, getRowId, selectionMode: "multi" as const, defaultSelection: ["a", "b"] as Selection };
    const m = mount(options);
    assert.deepEqual(m.model.selection, ["a", "b"]);
    m.update({ ...options, rows: people.filter((p) => p.id !== "a") });
    assert.deepEqual(m.model.selection, ["b"]);
  });

  it("an empty table has nothing selected and nothing to toggle", () => {
    const m = mount({ rows: [], columns, getRowId, selectionMode: "multi" });
    assert.equal(m.model.allSelected, false);
    act(() => m.model.toggleAll());
    assert.deepEqual(m.model.selection, []);
  });

  it("uses row.id by default and the row index otherwise", () => {
    const m = mount({ rows: people, columns });
    assert.deepEqual(m.model.rowIds, ["a", "b", "c", "d", "e"]);
    const bare = mount({ rows: [{ name: "x" }, { name: "y" }] as unknown as Person[], columns: [{ key: "name", header: "n" }] });
    assert.deepEqual(bare.model.rowIds, ["0", "1"]);
  });

  it("several calls in one tick build on each other (uncontrolled selection and sort)", () => {
    const m = mount({ rows: people, columns, getRowId, selectionMode: "multi" });
    act(() => {
      m.model.toggleRow("a");
      m.model.toggleRow("b");
      m.model.selectRow("c");
    });
    assert.deepEqual(m.model.selection, ["a", "b", "c"]);
    act(() => {
      ["a", "b"].forEach((id) => m.model.deselectRow(id));
    });
    assert.deepEqual(m.model.selection, ["c"]);
    act(() => {
      m.model.toggleSort("age");
      m.model.toggleSort("age");
    });
    assert.deepEqual(m.model.sort, { key: "age", direction: "desc" });
    act(() => {
      m.model.toggleSort("age");
      m.model.toggleSort("age");
    });
    assert.deepEqual(m.model.sort, { key: "age", direction: "asc" }, "desc -> none -> asc");
  });

  it("with a controlled value every call in one tick is relative to the value the parent last passed", () => {
    const changes: Selection[] = [];
    const m = mount({ rows: people, columns, getRowId, selectionMode: "multi", selection: [], onSelectionChange: (s) => changes.push(s) });
    act(() => {
      m.model.toggleRow("a");
      m.model.toggleRow("b");
    });
    assert.deepEqual(changes, [["a"], ["b"]]);
  });

  it("toggleAll on 50,000 selected rows is linear (well under a second)", () => {
    const rows = Array.from({ length: 50_000 }, (_, i) => ({ id: String(i), name: `n${i}`, age: i }));
    const bigColumns: DataTableColumn<Person>[] = [{ key: "name", header: "n" }];
    const m = mount({ rows: rows as unknown as Person[], columns: bigColumns, selectionMode: "multi" });
    act(() => m.model.selectAll());
    assert.equal(m.model.allSelected, true);
    const start = performance.now();
    act(() => m.model.toggleAll());
    const elapsed = performance.now() - start;
    assert.deepEqual(m.model.selection, []);
    assert.ok(elapsed < (process.env.NODE_V8_COVERAGE ? 2000 : 500), `toggleAll took ${elapsed.toFixed(0)} ms`);
  });

  it("an uncontrolled defaultSelection is normalized for the mode", () => {
    assert.deepEqual(mount({ rows: people, columns, getRowId, selectionMode: "single", defaultSelection: ["a", "b"] }).model.selection, ["b"]);
    assert.deepEqual(mount({ rows: people, columns, getRowId, selectionMode: "none", defaultSelection: ["a"] }).model.selection, []);
    assert.deepEqual(mount({ rows: people, columns, getRowId, selectionMode: "multi", defaultSelection: ["a", "a"] }).model.selection, ["a"]);
  });

  it("event handlers keep their identity across renders", () => {
    const options = { rows: people, columns, getRowId, selectionMode: "multi" as const };
    const m = mount(options);
    const { toggleSort, toggleRow, selectAll, toggleAll } = m.model;
    act(() => m.model.toggleRow("a"));
    assert.ok(m.model.toggleSort === toggleSort && m.model.toggleRow === toggleRow && m.model.selectAll === selectAll && m.model.toggleAll === toggleAll);
  });
});

describe("PLRNUI-211 model files", () => {
  it("import nothing from react-native (they run in plain Node)", () => {
    const dir = join(import.meta.dirname, "../../src/components/DataTable/model");
    const offenders: string[] = [];
    for (const file of readdirSync(dir)) {
      const text = readFileSync(join(dir, file), "utf8");
      if (/from\s+["']react-native|require\(["']react-native|expo-/.test(text)) offenders.push(file);
    }
    assert.deepEqual(offenders, []);
  });

  it("use no hard-coded colors", () => {
    const dir = join(import.meta.dirname, "../../src/components/DataTable");
    const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
    for (const file of walk(dir).filter((f) => /\.(ts|tsx)$/.test(f))) {
      assert.equal(/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(readFileSync(file, "utf8")), false, file);
    }
  });
});

describe("PLRNUI-211 benchmark", () => {
  it("sorts 50,000 rows in under 150 ms (numbers, ASCII strings and empty cells)", () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const rows = Array.from({ length: 50_000 }, (_, i) => ({
      id: String(i),
      n: Math.floor(rnd() * 1000),
      s: `Name ${Math.floor(rnd() * 100000)}`,
      d: rnd() < 0.05 ? null : rnd(),
    }));
    type Row = (typeof rows)[number];
    const cols: DataTableColumn<Row>[] = ["n", "s", "d"].map((key) => ({ key, header: key, sortable: true }));
    const report: string[] = [];
    for (const key of ["n", "s", "d"]) {
      for (const direction of ["asc", "desc"] as const) {
        const times: number[] = [];
        for (let run = 0; run < 5; run += 1) {
          const start = performance.now();
          sortOrder(rows, cols, { key, direction });
          times.push(performance.now() - start);
        }
        const best = Math.min(...times);
        report.push(`${key} ${direction}: best ${best.toFixed(1)} ms of 5`);
        // Coverage instrumentation (node --experimental-test-coverage sets NODE_V8_COVERAGE) slows the run several times over.
        const limit = process.env.NODE_V8_COVERAGE ? 600 : 150;
        assert.ok(best < limit, `${key} ${direction} took ${best.toFixed(1)} ms (limit ${limit})`);
      }
    }
    console.log(`# DataTable sort benchmark, 50,000 rows:\n# ${report.join("\n# ")}`);
  });
});

function Example({ rows }: { rows: Person[] }) {
  const { theme } = useTheme();
  const model = useDataTable({ rows, columns, getRowId, selectionMode: "multi" });
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      {columns.slice(0, 2).map((column) => (
        <Pressable key={column.key} accessibilityRole="button" accessibilityLabel={`Sort by ${column.header}`} onPress={() => model.toggleSort(column.key)}>
          <Text style={{ color: theme.colors.textPrimary }}>{column.header}</Text>
        </Pressable>
      ))}
      {model.rows.map((row) => (
        <Pressable key={row.id} accessibilityRole="checkbox" accessibilityState={{ checked: model.isSelected(row.id) }} onPress={() => model.toggleRow(row.id)}>
          <Text style={{ color: model.isSelected(row.id) ? theme.colors.textMuted : theme.colors.textPrimary }}>{row.name ?? "-"}</Text>
        </Pressable>
      ))}
    </View>
  );
}

describe("PLRNUI-211 rendered example", () => {
  for (const mode of ["light", "dark"] as const) {
    it(`renders and sorts under the ${mode} ThemeProvider with theme colors only`, () => {
      let renderer!: TestRenderer.ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(
          <ThemeProvider initialMode={mode} persistTheme={false}>
            <Example rows={people} />
          </ThemeProvider>,
        );
      });
      const texts = () => renderer.root.findAll((n) => (n.type as unknown) === "Text").map((n) => String(n.props.children));
      assert.deepEqual(texts().slice(2), ["Carla", "anna", "Bruno", "-", "Dora"]);
      const header = renderer.root.findAll((n) => n.props.accessibilityLabel === "Sort by Name")[0]!;
      act(() => header.props.onPress());
      assert.deepEqual(texts().slice(2), ["anna", "Bruno", "Carla", "Dora", "-"]);
      const row = renderer.root.findAll((n) => n.props.accessibilityRole === "checkbox")[0]!;
      act(() => row.props.onPress());
      assert.equal(renderer.root.findAll((n) => n.props.accessibilityRole === "checkbox")[0]!.props.accessibilityState.checked, true);
      const colors = renderer.root.findAll((n) => (n.type as unknown) === "Text").map((n) => (n.props.style as { color: string }).color);
      assert.ok(colors.every((c) => typeof c === "string" && c.length > 0));
      const bg = (renderer.root.findAll((n) => (n.type as unknown) === "View")[0]!.props.style as { backgroundColor: string }).backgroundColor;
      assert.equal(bg, mode === "dark" ? darkColors.background : lightColors.background);
    });
  }
});
