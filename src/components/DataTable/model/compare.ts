// Default ordering of cell values. Pure; no React.

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

// null and undefined are "empty"; they sort after every value in both directions (see sortRows).
export const isEmpty = (value: unknown): value is null | undefined => value === null || value === undefined;

// Rank of a value kind, so values of different kinds still have a total order.
function rank(value: unknown): number {
  switch (typeof value) {
    case "number":
    case "bigint":
      return 0;
    case "string":
      return 1;
    case "boolean":
      return 2;
    default:
      return value instanceof Date ? 3 : 4;
  }
}

/**
 * The default ascending order of two non-empty cell values: numbers and bigints numerically (NaN last among numbers),
 * strings with a numeric, case-insensitive locale collator, `false` before `true`, dates by time. Values of different
 * kinds are ordered by kind (numbers, strings, booleans, dates, anything else) and anything else compares equal.
 */
export function compareValues(a: unknown, b: unknown): number {
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  switch (ra) {
    case 0: {
      const x = a as number | bigint;
      const y = b as number | bigint;
      const xNaN = typeof x === "number" && Number.isNaN(x);
      const yNaN = typeof y === "number" && Number.isNaN(y);
      if (xNaN || yNaN) return xNaN === yNaN ? 0 : xNaN ? 1 : -1;
      return x < y ? -1 : x > y ? 1 : 0;
    }
    case 1:
      return collator.compare(a as string, b as string);
    case 2:
      return Number(a) - Number(b);
    case 3: {
      const x = (a as Date).getTime();
      const y = (b as Date).getTime();
      const xNaN = Number.isNaN(x);
      const yNaN = Number.isNaN(y);
      if (xNaN || yNaN) return xNaN === yNaN ? 0 : xNaN ? 1 : -1;
      return x - y;
    }
    default:
      return 0;
  }
}
