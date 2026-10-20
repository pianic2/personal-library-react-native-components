# Accordion

**Stability:** prototype — experimental, not yet exported from the package root.

A group of disclosure items built on [Collapsible](Collapsible.md). In `single` mode opening an item closes the others; in `multiple` mode items open independently.

## Import

Not exported from the package root yet (the wiring tickets own that); import from the component folder:

```ts
import { Accordion } from "./src/components/Accordion/index.js";
import type { AccordionProps } from "./src/components/Accordion/index.js";
```

## Props

```ts
interface AccordionProps extends Omit<ViewProps, "children" | "style"> {
  type?: "single" | "multiple"; // default "single"
  collapsible?: boolean; // single mode: allow closing the open item, default false
  value?: string | string[]; // controlled: string ("" = none) in single, string[] in multiple
  defaultValue?: string | string[]; // uncontrolled initial value, same shape
  onValueChange?: (value: string | string[]) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

interface AccordionItemProps extends Omit<ViewProps, "children" | "style"> {
  value: string; // unique within the accordion
  disabled?: boolean; // the header cannot be toggled
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

interface AccordionHeaderProps extends Omit<PressableProps, "children" | "style"> {
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  testID?: string;
  children?: React.ReactNode; // a string is rendered as the title text
}

interface AccordionPanelProps extends Omit<ViewProps, "children" | "style"> {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}
```

## Usage

```tsx
<Accordion type="single" collapsible defaultValue="shipping">
  <Accordion.Item value="shipping">
    <Accordion.Header>Shipping</Accordion.Header>
    <Accordion.Panel>
      <Text>Orders ship within two days.</Text>
    </Accordion.Panel>
  </Accordion.Item>
  <Accordion.Item value="returns" disabled>
    <Accordion.Header>Returns</Accordion.Header>
    <Accordion.Panel>
      <Text>Not available.</Text>
    </Accordion.Panel>
  </Accordion.Item>
</Accordion>

// Controlled, multiple
<Accordion type="multiple" value={open} onValueChange={(next) => setOpen(next as string[])}>
  ...
</Accordion>
```

## Behaviour

- `single`: opening an item closes the open one. Without `collapsible` the open item cannot be closed by tapping its header.
- `multiple`: each item toggles on its own; `onValueChange` receives the array of open values.
- Controlled with `value` and `onValueChange`; the component only reports the request.
- Animation, reduced motion and unmounting of closed panels come from Collapsible.

## Accessibility

- The header has `accessibilityRole="button"` and `accessibilityState.expanded` (plus `disabled` for a disabled item); on web it sets `aria-expanded` and `aria-controls`.
- The panel is labelled by its header (`accessibilityLabelledBy`, `aria-labelledby`); closed panels are hidden from screen readers.
- The chevron is decorative and hidden from assistive technology.

## Stability

prototype: not exported from the package root, the docs nav or the catalog yet (E14 wave-wiring). Styling uses the `accordion` variants with semantic theme tokens only.
