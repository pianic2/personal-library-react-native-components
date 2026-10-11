# Slot

**Stability:** prototype — experimental, not yet exported from the package root.

Merges its own props into its single child element instead of rendering a wrapper (the `asChild` pattern).

## Import

```ts
import { Slot } from "@personal-library/react-native-components";
```

## Props

```ts
type SlotProps = ViewProps & {
  children: ReactElement;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
};
```

`Slot` also accepts a `ref`, merged with the child's own ref through `useMergedRefs`.

## Usage

```tsx
<Slot accessibilityRole="button" onPress={track} style={{ opacity: 0.9 }}>
  <Pressable onPress={submit} style={{ padding: 8 }} />
</Slot>
```

`submit` runs first and then `track`; the style array is `[{ opacity: 0.9 }, { padding: 8 }]`.

## Merge rules (`mergeProps(slotProps, childProps)`)

- `style`: concatenated into one flat array, slot first, child last, so the child wins.
- `on*` handlers: chained, child first and then slot.
- `accessibilityState` and `accessibilityValue`: merged key by key, the child wins per key.
- other `accessibility*` and `aria-*` props, and every other prop: the child wins unless its value is `undefined`.
- refs: merged with `useMergedRefs`.

## Comportamento

- The child must be exactly one valid element and not a Fragment. In `__DEV__` anything else throws a descriptive error; in production nothing is rendered.
- Handlers such as `onPress` only fire if the child element is itself pressable.
- `Slot` uses no theme tokens.

## Stability

prototype: not exported from the package root, the docs nav or the catalog yet (E14 wave-wiring).
