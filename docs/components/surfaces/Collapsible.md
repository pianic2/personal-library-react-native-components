# Collapsible

**Stability:** prototype — experimental, not yet exported from the package root.

A disclosure region: `Collapsible.Trigger` shows or hides `Collapsible.Content`, whose height animates open and closed. It is the base for accordions, FAQ lists and advanced filters.

## Import

Not exported from the package root yet (the wiring tickets own that); import from the component folder:

```ts
import { Collapsible } from "./src/components/Collapsible/index.js";
import type { CollapsibleProps } from "./src/components/Collapsible/index.js";
```

## Props

```ts
interface CollapsibleProps extends Omit<ViewProps, "children" | "style"> {
  open?: boolean; // controlled
  defaultOpen?: boolean; // default false
  onOpenChange?: (open: boolean) => void;
  duration?: number; // ms, default 200
  animated?: boolean; // default true; false opens and closes instantly
  keepMounted?: boolean; // default false: closed content is unmounted
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

interface CollapsibleTriggerProps extends Omit<PressableProps, "children"> {
  asChild?: boolean; // merge the trigger props into the single child instead of rendering a Pressable
  children?: React.ReactNode;
}

interface CollapsibleContentProps extends Omit<ViewProps, "children" | "style"> {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}
```

## Usage

```tsx
// Uncontrolled
<Collapsible defaultOpen={false}>
  <Collapsible.Trigger>
    <Text>Advanced filters</Text>
  </Collapsible.Trigger>
  <Collapsible.Content>
    <Text>Filter controls</Text>
  </Collapsible.Content>
</Collapsible>

// Controlled, with your own pressable
<Collapsible open={open} onOpenChange={setOpen} keepMounted>
  <Collapsible.Trigger asChild>
    <Touchable accessibilityLabel="Toggle details">
      <Text>Details</Text>
    </Touchable>
  </Collapsible.Trigger>
  <Collapsible.Content>
    <Text>More information</Text>
  </Collapsible.Content>
</Collapsible>
```

## Behaviour

- Content is measured through `onLayout` and the height is animated with the motion engine; `LayoutAnimation` is not used. The default duration is 200 ms (`duration`).
- Closed content is unmounted, or hidden with a zero height when `keepMounted` is set.
- Reduced motion (system setting or `MotionProvider`) and `animated={false}` make the change instant.
- `Collapsible.Trigger` and `Collapsible.Content` throw outside a `Collapsible`.

## Accessibility

- The trigger has `accessibilityRole="button"` and `accessibilityState.expanded`; on web it also sets `aria-expanded` and `aria-controls`.
- Closed content is hidden from screen readers (`importantForAccessibility="no-hide-descendants"`, `accessibilityElementsHidden`, `aria-hidden`) and ignores touches.

## Stability

prototype: not exported from the package root, the docs nav or the catalog yet (E14 wave-wiring). The component has no colours of its own; it uses the `collapsible` variants (layout only) and the `theme.motion` tokens.
