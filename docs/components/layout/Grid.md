# Grid

**Stability:** prototype — experimental, not yet exported from the package root.

Equal-width wrapping columns with responsive column counts and `theme.space` gaps. Layout only: it renders plain `View`s, so light and dark mode look the same.

## Import

Not exported from the package root yet (the wiring tickets own that); import from the component folder:

```ts
import { Grid } from "./components/Grid/index.js";
import type { GridProps, GridItemProps } from "./components/Grid/index.js";
```

## Props

```ts
type SpaceKey = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl"; // keys of theme.space
type Count = number | Partial<Record<"base" | "sm" | "md" | "lg" | "xl", number>>;

interface GridProps extends ViewProps {
  columns?: Count; // default 1; with minItemWidth it is the maximum
  gap?: SpaceKey; // default "none", both axes
  rowGap?: SpaceKey; // overrides gap vertically
  columnGap?: SpaceKey; // overrides gap horizontally
  minItemWidth?: number; // auto-fit: as many columns as fit
  children?: React.ReactNode;
}

interface GridItemProps extends ViewProps {
  span?: Count; // default 1, clamped to 1..columns
}
```

## Usage

```tsx
<Grid columns={{ base: 1, md: 2, lg: 4 }} gap="md">
  <Card />
  <Card />
  <Card />
  <Card />
  <Card />
</Grid>

// A wide item
<Grid columns={3} gap="sm">
  <Grid.Item span={2}><Hero /></Grid.Item>
  <Grid.Item><Side /></Grid.Item>
</Grid>

// Auto-fit: items at least 160 wide, as many columns as fit
<Container>
  <Grid minItemWidth={160} gap="md">...</Grid>
</Container>
```

## Behaviour

- **Width math, no measuring.** Each item sits in a cell `span / columns` wide (a percentage). With gap `g`, the cell at column `c` spanning `s` of `n` columns is padded `c·g/n` on the left and `(n−c−s)·g/n` on the right. Every column content is then exactly `(W − (n−1)·g)/n` wide and the gap falls **between** items only, never at the outer edges, with no `onLayout` and no `calc`.
- **Wrapping.** The grid is a `flexWrap` row aligned to the start: a last row with fewer items stays left-aligned. A span larger than the remaining columns starts a new row; a span is clamped to `1..columns`.
- **Responsive.** `columns` and `span` maps are mobile-first and follow the window breakpoint (`useBreakpoint`): `{ base: 1, md: 2, lg: 4 }` gives 1 column below `md`, 2 from `md`, 4 from `lg`.
- **`minItemWidth`.** Columns = `floor((W + gap) / (minItemWidth + gap))`, at least 1 and at most `columns` when given; `W` is the width of the nearest `Container` (which includes its gutters), else the window. 160 in a 500 px container with no gap gives 3 columns.
- Any child that is not a `Grid.Item` is an item of span 1; children order is preserved.

## Accessibility

Pure layout: plain `View`s, no role, no accessibility props.

## Stability

`prototype`: the API may change before it is wired into the package root.
