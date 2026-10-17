# Spacer

**Stability:** beta — public consumer API, usable but contract may still change.

Empty space with a size taken from the spacing scale, or a flexible gap that fills the free space of its parent. It replaces ad-hoc `<View style={{ flex: 1 }} />` and margins when you push items apart.

## Import

```ts
import { Spacer } from "@personal-library/react-native-components";
import type { SpacerProps } from "@personal-library/react-native-components";
```

## Props

```ts
type SpacerSize = "xs" | "sm" | "md" | "lg"; // keys of theme.space (ADR 0014 sizes)

interface SpacerProps {
  size?: SpacerSize; // default "md"; ignored when flex is set
  axis?: "vertical" | "horizontal"; // default "vertical": vertical sets the height, horizontal the width
  flex?: boolean; // fills the free space (flex: 1)
  style?: StyleProp<ViewStyle>; // applied after the size
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

// A fixed horizontal gap
<Row>
  <Icon name="check" />
  <Spacer axis="horizontal" size="sm" />
  <Text>Done</Text>
</Row>
```

## Behaviour

- Fixed: `size` is one of the `theme.space` keys `xs`, `sm`, `md`, `lg`. `axis="vertical"` (the default) sets the height; `axis="horizontal"` sets the width.
- Flexible: `flex` renders `flex: 1`, so the Spacer takes the free space of its parent and pushes the siblings to the ends. `size` and `axis` are ignored then.
- The axis is not inferred from the parent: in a `Row` pass `axis="horizontal"` for a fixed gap. `flex` works in both directions.

## Accessibility

The Spacer is decorative: it is hidden from assistive technology (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`).
