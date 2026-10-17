# Spacer

**Stability:** beta — not yet exported from the package root (the wiring tickets own that).

Empty space with a size taken from the spacing scale, or a flexible gap that fills the free space of its parent. It replaces ad-hoc `<View style={{ flex: 1 }} />` and margins when you push items apart.

## Import

Not exported from the package root yet; import from the component folder:

```ts
import { Spacer } from "./components/Spacer/index.js";
import type { SpacerProps } from "./components/Spacer/index.js";
```

## Props

```ts
type SpaceKey = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl"; // keys of theme.space

interface SpacerProps {
  size?: SpaceKey | number; // default "md"; ignored when flex is set
  axis?: "vertical" | "horizontal"; // default "vertical": vertical sets the height, horizontal the width
  flex?: boolean; // fills the free space (flex: 1)
  testID?: string;
}
```

## Usage

```tsx
// Push the button to the end of the row
<Row>
  <Text>Total</Text>
  <Spacer flex />
  <Button label="Pay" onPress={pay} />
</Row>

// A token-sized vertical gap
<Column>
  <Heading level={1}>Title</Heading>
  <Spacer size="lg" />
  <Text>Body</Text>
</Column>

// A fixed horizontal gap of 12 points
<Row>
  <Icon name="check" />
  <Spacer axis="horizontal" size={12} />
  <Text>Done</Text>
</Row>
```

## Behaviour

- Fixed: `size` is a `theme.space` key or a number of points. `axis="vertical"` (the default) sets the height; `axis="horizontal"` sets the width.
- Flexible: `flex` renders `flex: 1`, so the Spacer takes the free space of its parent and pushes the siblings to the ends. `size` and `axis` are ignored then.
- The axis is not inferred from the parent: in a `Row` pass `axis="horizontal"` for a fixed gap. `flex` works in both directions.

## Accessibility

The Spacer is decorative: it is hidden from assistive technology (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`).
