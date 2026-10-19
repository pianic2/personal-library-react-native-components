import React from "react";
import { View, type ViewProps } from "react-native";
import { useBreakpoint, type Breakpoint } from "../../hooks/useBreakpoint.js";
import { resolveResponsive } from "../../responsive/resolve.js";
import { useContainerSize } from "../../responsive/useContainerSize.js";
import { useTheme } from "../../theme/useTheme.js";

type SpaceKey = keyof ReturnType<typeof useTheme>["theme"]["space"];

/** A number, or a map from breakpoint to number (mobile-first: a key applies up to the next defined key). */
export type GridCount = number | Partial<Record<Breakpoint, number>>;

export interface GridProps extends ViewProps {
  /** Number of equal-width columns, or a map from breakpoint to count. Default `1`. With `minItemWidth` it is the maximum. */
  columns?: GridCount;
  /** Space between items as a `theme.space` key, on both axes. Default `"none"`. */
  gap?: SpaceKey;
  /** Space between rows; overrides `gap` on the vertical axis. */
  rowGap?: SpaceKey;
  /** Space between columns; overrides `gap` on the horizontal axis. */
  columnGap?: SpaceKey;
  /** Auto-fit mode: as many columns as fit with items at least this wide (in pixels) in the nearest Container, else the window. */
  minItemWidth?: number;
  children?: React.ReactNode;
}

export interface GridItemProps extends ViewProps {
  /** Number of columns the item spans, or a map from breakpoint to span. Clamped to 1..columns. Default `1`. */
  span?: GridCount;
  children?: React.ReactNode;
}

/** An item of a `Grid` that can span several columns. Any other child of a `Grid` is an item of span 1. */
function GridItem({ span: _span, ...rest }: GridItemProps) {
  return <View {...rest} />;
}
GridItem.displayName = "Grid.Item";

const clampCount = (value: number | undefined, max: number): number => {
  if (value === undefined || !Number.isFinite(value)) return 1;
  return Math.min(Math.max(1, Math.floor(value)), max);
};

/** The number of columns: the (responsive) `columns`, limited by how many `minItemWidth` items fit in `width` when given. */
export function resolveColumnCount(columns: GridCount | undefined, bp: Breakpoint, width: number, gap: number, minItemWidth?: number): number {
  const mapped = columns === undefined ? undefined : resolveResponsive(columns, bp);
  const max = clampCount(mapped, Number.MAX_SAFE_INTEGER);
  if (minItemWidth === undefined || !(minItemWidth > 0)) return columns === undefined ? 1 : max;
  const fit = Math.max(1, Math.floor((width + gap) / (minItemWidth + gap)));
  return columns === undefined ? fit : Math.min(fit, max);
}

/**
 * Equal-width wrapping columns without width arithmetic. Each item sits in a cell `span / columns` wide, padded so the
 * gap falls between items only: the cell at column `c` spanning `s` of `n` columns gets `c·g/n` on the left and
 * `(n−c−s)·g/n` on the right, which makes every content width exactly `(W − (n−1)·g)/n` per column.
 */
function GridRoot({ columns, gap = "none", rowGap, columnGap, minItemWidth, style, children, ...rest }: GridProps) {
  const { theme } = useTheme();
  const bp = useBreakpoint();
  const { width } = useContainerSize();
  const colGap = theme.space[columnGap ?? gap];
  const rGap = theme.space[rowGap ?? gap];
  const n = resolveColumnCount(columns, bp, width, colGap, minItemWidth);

  let column = 0;
  const cells = React.Children.toArray(children).map((child) => {
    const requested = React.isValidElement<GridItemProps>(child) && child.type === GridItem ? resolveResponsive(child.props.span ?? 1, bp) : 1;
    const span = clampCount(requested, n);
    if (column + span > n) column = 0;
    const start = column;
    column += span;
    if (column >= n) column = 0;
    const key = React.isValidElement(child) ? (child.key ?? undefined) : undefined;
    return (
      <View
        key={key}
        style={{
          width: `${(span / n) * 100}%`,
          paddingLeft: (start * colGap) / n,
          paddingRight: ((n - start - span) * colGap) / n,
        }}
      >
        {child}
      </View>
    );
  });

  return (
    <View {...rest} style={[{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "flex-start", rowGap: rGap }, style]}>
      {cells}
    </View>
  );
}
GridRoot.displayName = "Grid";

export const Grid = Object.assign(GridRoot, { Item: GridItem });
