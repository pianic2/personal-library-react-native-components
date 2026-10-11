# Label

**Stability:** prototype — experimental, not yet exported from the package root.

Label for form and custom controls with a required marker, an optional hint, a disabled state and press-to-focus.

## Import

```ts
// not exported from the package root yet (E14 wave-wiring); until then:
import { Label } from "<package>/src/components/Label";
```

## Props

```ts
interface LabelProps extends Omit<TextProps, "children" | "size" | "variant" | "onPress"> {
  children?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  onPress?: () => void;
  htmlFor?: RefObject<{ focus(): void } | null>;
  nativeID?: string;
}
```

## Usage

```tsx
const name = useRef<TextInput>(null);

<Label nativeID="name-label" required htmlFor={name}>Name</Label>
<TextInput ref={name} accessibilityLabelledBy="name-label" />
```

## Behavior

- `required` shows a `*` in the error colour and speaks the label as "Name, required"; an explicit `accessibilityLabel` is used as the base text, and when the children are not plain text and no `accessibilityLabel` is given the label is left to the screen reader. `required` wins over `optional`.
- `optional` appends a muted "(optional)".
- `disabled` mutes the text, sets `accessibilityState.disabled` and ignores presses.
- Pressing the label focuses the control in `htmlFor` and then calls `onPress`. This is a pointer convenience; the control itself stays the accessible target.
- `size` is `sm` or `md` (default `md`); colours come from the theme (`textPrimary`, `textMuted`, `error`).

## Stability

prototype: not exported from the package root, the docs nav or the catalog yet (E14 wave-wiring).
